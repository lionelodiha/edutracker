using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.GetUserById;

public sealed record GetUserByIdQuery(
    Guid? Id
) : IMessage<OperationResult<UserResponse>>;
