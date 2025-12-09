using System.Text.Json.Serialization;

namespace EduTracker.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Email { get; set; }
    public string? Username { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? MiddleName { get; set; }
    public required string Role { get; set; } // "student", "teacher", "admin"
    public string Status { get; set; } = "pending"; // "active", "pending", "rejected"
    
    [JsonIgnore]
    public string Password { get; set; } = string.Empty; // Storing plain text for now as per instructions (mock-like behavior), but in real app should be hashed
    
    public string? AvatarUrl { get; set; }
    
    public string? OrganizationId { get; set; }
}
