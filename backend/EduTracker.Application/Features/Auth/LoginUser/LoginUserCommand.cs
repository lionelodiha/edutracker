using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.LoginUser;

public sealed record LoginUserCommand(
    string Identifier,
    string Password,
    bool RememberMe = false,
    Guid? ActiveSessionId = null
) : IMessage<OperationResult<SessionResult>>;
