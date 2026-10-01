using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.RefreshSession;

public sealed record RefreshSessionCommand(
    Guid? SessionId
) : IMessage<OperationResult<SessionResult>>;
