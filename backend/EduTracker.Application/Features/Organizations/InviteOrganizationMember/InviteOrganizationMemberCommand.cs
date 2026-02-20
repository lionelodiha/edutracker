using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.InviteOrganizationMember;

public sealed record InviteOrganizationMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid UserId,
    string RoleKey
) : IMessage<OperationResult<Guid>>;
