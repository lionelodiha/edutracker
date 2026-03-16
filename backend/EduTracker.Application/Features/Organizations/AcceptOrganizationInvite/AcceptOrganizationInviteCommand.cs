using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.AcceptOrganizationInvite;

public sealed record AcceptOrganizationInviteCommand(
    Guid? ActorId,
    Guid InviteId
) : IMessage<OperationResult<object>>;
