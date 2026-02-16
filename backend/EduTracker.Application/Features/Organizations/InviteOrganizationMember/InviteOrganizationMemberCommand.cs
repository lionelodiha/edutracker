using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;
using EduTracker.Domain.Enums;

namespace EduTracker.Application.Features.Organizations.InviteOrganizationMember;

public sealed record InviteOrganizationMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid UserId,
    OrganizationMemberRole Role
) : IMessage<OperationResult<Guid>>;
