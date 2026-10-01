namespace EduTracker.Application.Configurations.Seeders;

public sealed record class SuperAdminSeedOptions
{
    public string FirstName { get; init; } = string.Empty;
    public string? MiddleName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
