using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationInvites.CancelOrganizationInvite;

public sealed record CancelOrganizationInviteCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid InviteId
) : IMessage<OperationResult<object>>;
