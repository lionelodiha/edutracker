using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Sessions.RevokeAllUserSessions;

public sealed record RevokeAllUserSessionsCommand(
    Guid? ActorId,
    Guid? UserId,
    Guid? SessionId
) : IMessage<OperationResult<object>>;
