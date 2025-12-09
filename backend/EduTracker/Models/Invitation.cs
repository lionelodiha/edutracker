using System.ComponentModel.DataAnnotations;

namespace EduTracker.Models;

public class Invitation
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
    
    [Required]
    public required string Role { get; set; } // "student", "teacher"
    
    [Required]
    public required string OrganizationId { get; set; }
    
    public string Status { get; set; } = "pending"; // "pending", "used", "expired"
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}
