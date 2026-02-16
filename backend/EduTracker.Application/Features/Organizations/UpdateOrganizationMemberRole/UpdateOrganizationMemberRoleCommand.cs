using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;
using EduTracker.Domain.Enums;

namespace EduTracker.Application.Features.Organizations.UpdateOrganizationMemberRole;

public sealed record UpdateOrganizationMemberRoleCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid MemberId,
    OrganizationMemberRole Role
) : IMessage<OperationResult<object>>;
