using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.RevokeSession;

public record RevokeSessionRequest(
    Guid? SessionId
) : IRequest<OperationResult<object>>;
