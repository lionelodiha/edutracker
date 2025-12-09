using EduTracker.Models;

namespace EduTracker.DTOs;

public class AuthResponse
{
    public required User User { get; set; }
    public required string Token { get; set; }
}
