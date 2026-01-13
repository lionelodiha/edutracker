using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.LoginUser;

public record LoginUserRequest(
    string Identifier,
    string Password,
    bool RememberMe = false
) : IRequest<OperationResult<SessionResult>>;
