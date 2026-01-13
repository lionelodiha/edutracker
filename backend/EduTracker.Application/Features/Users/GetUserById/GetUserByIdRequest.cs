using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.GetUserById;

public record GetUserByIdRequest(
    Guid Id
) : IRequest<OperationResult<UserResponse>>;
