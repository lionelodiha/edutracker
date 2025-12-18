using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.Login;

public record LoginUserCommand(
    string Identifier,
    string Password,
    bool RememberMe
) : IRequest<OperationResult<SessionData>>;
