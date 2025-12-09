using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using EduTracker.Data;
using EduTracker.Models;
using EduTracker.DTOs;
using System.IO;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;

    public SubscriptionController(IConfiguration configuration, AppDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateSubscriptionRequest request)
    {
        Console.WriteLine($"Received subscription request for: {request.OrganizationName}, Admin: {request.AdminEmail}");
        var stripeKey = _configuration["Stripe:SecretKey"];
        if (string.IsNullOrEmpty(stripeKey) || stripeKey.Contains("replace_me"))
        {
            return BadRequest(new { message = "Stripe is not configured. To test the payment flow, please add your Stripe Test API keys (SecretKey) to appsettings.json." });
        }

        // Check if user already exists
        if (_context.Users.Any(u => u.Email == request.AdminEmail))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        StripeConfiguration.ApiKey = stripeKey;

        var options = new SessionCreateOptions
        {
            CustomerEmail = request.AdminEmail, // Enable Stripe email receipts
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "EduTracker School Subscription",
                        },
                        UnitAmount = 2900, // $29.00
                        Recurring = new SessionLineItemPriceDataRecurringOptions
                        {
                            Interval = "month",
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "subscription",
            SuccessUrl = $"{request.SuccessUrl}?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = request.CancelUrl,
            Metadata = new Dictionary<string, string>
            {
                { "orgName", request.OrganizationName },
                { "adminEmail", request.AdminEmail },
                { "adminFirstName", request.AdminFirstName },
                { "adminLastName", request.AdminLastName },
                { "adminPassword", request.AdminPassword } // In production, don't pass password here or handle it differently
            }
        };

        var service = new SessionService();
        Session session = await service.CreateAsync(options);

        return Ok(new { url = session.Url });
    }

    [HttpGet("session/{sessionId}")]
    public async Task<IActionResult> GetSession(string sessionId)
    {
        var stripeKey = _configuration["Stripe:SecretKey"];
        StripeConfiguration.ApiKey = stripeKey;

        var service = new SessionService();
        try 
        {
            var session = await service.GetAsync(sessionId);
            
            // Ensure user exists (in case webhook failed or hasn't fired yet)
            var adminEmail = session.Metadata["adminEmail"];
            var user = _context.Users.FirstOrDefault(u => u.Email == adminEmail);
            
            if (user == null && session.PaymentStatus == "paid")
            {
                // Force create user if missing (Webhook backup)
                await HandleCheckoutSessionCompleted(session);
                user = _context.Users.FirstOrDefault(u => u.Email == adminEmail);
            }

            // Mock sending an email receipt from our system
            if (session.PaymentStatus == "paid")
            {
                 Console.WriteLine($"[Email Service] Sending receipt to {session.CustomerEmail} for amount {session.AmountTotal}");
            }

            return Ok(new 
            { 
                customerEmail = session.CustomerEmail,
                amountTotal = session.AmountTotal,
                currency = session.Currency,
                paymentStatus = session.PaymentStatus,
                user = user,
                token = user != null ? "mock-jwt-token-" + Guid.NewGuid().ToString() : null
            });
        }
        catch(Exception ex)
        {
             return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var webhookSecret = _configuration["Stripe:WebhookSecret"];

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], webhookSecret);

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Session;
                if (session != null) 
                {
                    await HandleCheckoutSessionCompleted(session);
                }
            }

            return Ok();
        }
        catch (StripeException e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    private async Task HandleCheckoutSessionCompleted(Session session)
    {
        // Extract metadata
        var orgName = session.Metadata["orgName"];
        var adminEmail = session.Metadata["adminEmail"];
        var adminFirstName = session.Metadata["adminFirstName"];
        var adminLastName = session.Metadata["adminLastName"];
        var adminPassword = session.Metadata["adminPassword"];

        // Check if user already exists (idempotency)
        if (_context.Users.Any(u => u.Email == adminEmail))
        {
            Console.WriteLine($"Skipping user creation for {adminEmail} - already exists.");
            return;
        }
        
        // Create Organization
        var organization = new Organization
        {
            Name = orgName,
            SubscriptionStatus = "active",
            StripeCustomerId = session.CustomerId,
            StripeSubscriptionId = session.SubscriptionId
        };
        
        _context.Organizations.Add(organization);
        
        // Create Admin User
        var adminUser = new User
        {
            Email = adminEmail,
            FirstName = adminFirstName,
            LastName = adminLastName,
            Role = "admin",
            Status = "active",
            Password = adminPassword,
            AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(adminFirstName + "+" + adminLastName)}",
            OrganizationId = organization.Id
        };

        _context.Users.Add(adminUser);
        
        await _context.SaveChangesAsync();
    }
}
