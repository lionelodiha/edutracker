using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationInvites.InviteOrganizationMember;

public sealed record InviteOrganizationMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid UserId
) : IMessage<OperationResult<Guid>>;
