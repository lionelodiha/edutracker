using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Features.OrganizationMembers.AddStaffMember;

// TEMPORARY FEATURE — direct provisioning of teachers/students/admins by an organization owner.
// This lets an admin create a user account + organization membership in one call. It will be
// replaced by the email-token portal-invite flow once the backend dev ships those endpoints
// (see School_API_Requirements.md §2).
public sealed record AddStaffMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string FirstName,
    string? MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password,
    OrganizationMemberRole Role
) : IMessage<OperationResult<Guid>>;
