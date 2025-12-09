using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using EduTracker.Data;
using EduTracker.Models;
using EduTracker.DTOs;
using System.IO;
using EduTracker.Interfaces.Services;
using EduTracker.Endpoints.Users;
using EduTracker.Endpoints.Users.RegisterUser;
using EntityUser = EduTracker.Entities.User;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubscriptionController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;
    private readonly IHashingService _hashingService;
    private readonly IDataEncryptionService _dataEncryptionService;

    public SubscriptionController(IConfiguration configuration, AppDbContext context, IHashingService hashingService, IDataEncryptionService dataEncryptionService)
    {
        _configuration = configuration;
        _context = context;
        _hashingService = hashingService;
        _dataEncryptionService = dataEncryptionService;
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
        string normalizedEmail = request.AdminEmail.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        if (_context.Users.Any(u => u.EmailHash == emailHash))
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
            string normalizedEmail = adminEmail.Trim().ToLowerInvariant();
            string emailHash = _hashingService.HashEmail(normalizedEmail);

            var user = _context.Users.FirstOrDefault(u => u.EmailHash == emailHash);
            
            if (user == null && session.PaymentStatus == "paid")
            {
                // Force create user if missing (Webhook backup)
                await HandleCheckoutSessionCompleted(session);
                user = _context.Users.FirstOrDefault(u => u.EmailHash == emailHash);
            }

            // Mock sending an email receipt from our system
            if (session.PaymentStatus == "paid")
            {
                 Console.WriteLine($"[Email Service] Sending receipt to {session.CustomerEmail} for amount {session.AmountTotal}");
            }

            object? userDto = null;
            if (user != null)
            {
                userDto = new
                {
                    Id = user.Id,
                    Email = adminEmail,
                    FirstName = session.Metadata["adminFirstName"], // Fallback to metadata as we can't easily decrypt without logic
                    LastName = session.Metadata["adminLastName"],
                    Role = user.Role,
                    Status = user.Status,
                    AvatarUrl = user.AvatarUrl,
                    OrganizationId = user.OrganizationId
                };
            }

            return Ok(new 
            { 
                customerEmail = session.CustomerEmail,
                amountTotal = session.AmountTotal,
                currency = session.Currency,
                paymentStatus = session.PaymentStatus,
                user = userDto,
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

        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            Console.WriteLine($"Error: Password for {adminEmail} is empty in metadata.");
            return;
        }

        string normalizedEmail = adminEmail.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);
        string normalizedPassword = adminPassword.Trim(); // Ensure password is trimmed

        // Check if user already exists (idempotency)
        if (_context.Users.Any(u => u.EmailHash == emailHash))
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
        
        // Generate unique username
        string baseUsername = (adminFirstName.ToLower() + "." + adminLastName.ToLower()).Trim();
        string finalUsername = baseUsername;
        int counter = 1;
        
        while (_context.Users.Any(u => u.UserName == finalUsername))
        {
            finalUsername = $"{baseUsername}{counter}";
            counter++;
        }
        
        // Create Admin User
        var registerRequest = new RegisterUserRequest(
            adminFirstName,
            "", // MiddleName
            adminLastName,
            finalUsername,
            adminEmail,
            normalizedPassword
        );

        string passwordHash = _hashingService.HashPassword(normalizedPassword);

        EntityUser adminUser = UserFactory.Create(
            registerRequest,
            normalizedEmail,
            emailHash,
            passwordHash,
            _dataEncryptionService
        );

        adminUser.SetRole("admin");
        adminUser.SetStatus("active");
        adminUser.SetAvatarUrl($"https://ui-avatars.com/api/?name={Uri.EscapeDataString(adminFirstName + "+" + adminLastName)}");
        adminUser.SetOrganizationId(organization.Id);

        _context.Users.Add(adminUser);
        
        await _context.SaveChangesAsync();
    }
}
