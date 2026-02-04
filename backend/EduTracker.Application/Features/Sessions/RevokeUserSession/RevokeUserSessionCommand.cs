using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Sessions.RevokeUserSession;

public sealed record RevokeUserSessionCommand(
    Guid? ActorId,
    Guid? UserId,
    Guid? SessionId
) : IMessage<OperationResult<object>>;
