using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationInvites.RejectOrganizationInvite;

public sealed record RejectOrganizationInviteCommand(
    Guid? ActorId,
    Guid InviteId
) : IMessage<OperationResult<object>>;
