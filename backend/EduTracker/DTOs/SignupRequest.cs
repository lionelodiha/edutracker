namespace EduTracker.DTOs;

public class SignupRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string FullName { get; set; }
    public required string Role { get; set; }
    public string? Status { get; set; }
}
