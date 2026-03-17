namespace EduTracker.Application.Configurations.Organizations;

public sealed record OrganizationInviteOptions
{
    public int ExpiryDays { get; init; } = 7;
}
