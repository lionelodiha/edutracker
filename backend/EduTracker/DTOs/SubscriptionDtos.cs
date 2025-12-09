namespace EduTracker.DTOs;

public class CreateSubscriptionRequest
{
    public required string OrganizationName { get; set; }
    public required string AdminEmail { get; set; }
    public required string AdminFirstName { get; set; }
    public required string AdminLastName { get; set; }
    public required string AdminPassword { get; set; }
    public required string SuccessUrl { get; set; }
    public required string CancelUrl { get; set; }
}
