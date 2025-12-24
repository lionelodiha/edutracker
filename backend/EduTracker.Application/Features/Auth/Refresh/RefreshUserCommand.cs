using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.Refresh;

public record RefreshUserCommand(
    Guid SessionId
) : IRequest<OperationResult<SessionData>>;
