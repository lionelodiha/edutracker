using EduTracker.Application.CQRS.Messaging;

namespace EduTracker.Application.Features.Auth.Revoke;

public record RevokeUserCommand(
    Guid SessionId
) : IRequest<bool>;
