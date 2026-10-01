using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.GetUsers;

public sealed record GetUsersQuery(
    Guid? Cursor,
    int? Limit,
    Guid? Id,
    string? UserName
) : IMessage<OperationResult<CursorPage<UserResponse>>>;
