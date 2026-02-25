using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.UpdateOrganizationMemberRole;

public sealed record UpdateOrganizationMemberRoleCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid MemberId,
    OrganizationMemberRole Role
) : IMessage<OperationResult<object>>;
