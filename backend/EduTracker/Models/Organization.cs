using System;

namespace EduTracker.Models;

public class Organization
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Name { get; set; }
    public string SubscriptionStatus { get; set; } = "trial"; // "active", "past_due", "canceled", "trial"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Stripe fields for future use
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
}
