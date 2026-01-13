using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.Logout;

public record LogoutUserRequest(
    Guid? SessionId
) : IRequest<OperationResult<object>>;
