using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.RefreshSession;

public record RefreshSessionRequest(
    Guid? SessionId
) : IRequest<OperationResult<SessionResult>>;
