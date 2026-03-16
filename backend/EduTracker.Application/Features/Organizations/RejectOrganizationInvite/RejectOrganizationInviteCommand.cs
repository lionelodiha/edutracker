using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.RejectOrganizationInvite;

public sealed record RejectOrganizationInviteCommand(
    Guid? ActorId,
    Guid InviteId
) : IMessage<OperationResult<object>>;
