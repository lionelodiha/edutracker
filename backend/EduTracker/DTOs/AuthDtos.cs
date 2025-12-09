namespace EduTracker.DTOs;

public record LoginDto(string EmailOrUsername, string Password, string? Role = null);
public record SignupDto(string Email, string Password, string FirstName, string LastName, string? MiddleName, string? Username, string Role, string? OrganizationId = null);
public record InvitationSignupDto(string Token, string Password, string FirstName, string LastName, string? MiddleName, string? Username);
public record UserStatusUpdateDto(string Status);
