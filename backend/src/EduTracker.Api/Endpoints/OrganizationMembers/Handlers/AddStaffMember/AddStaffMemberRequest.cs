using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Api.Endpoints.OrganizationMembers.Handlers.AddStaffMember;

// TEMPORARY — see AddStaffMemberCommand.cs for context.
internal sealed record AddStaffMemberRequest(
    string FirstName,
    string? MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password,
    OrganizationMemberRole Role
);
