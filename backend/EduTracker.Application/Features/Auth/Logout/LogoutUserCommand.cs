using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.Logout;

public record LogoutUserCommand(
    Guid SessionId
) : IRequest<OperationResult<object>>;
