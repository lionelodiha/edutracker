using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.GetCurrentUser;

public record GetCurrentUserRequest(
    Guid? UserId
) : IRequest<OperationResult<UserResponse>>;
