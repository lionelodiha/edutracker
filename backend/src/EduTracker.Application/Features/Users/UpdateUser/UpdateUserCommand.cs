using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.UpdateUser;

public sealed record UpdateUserCommand(
    Guid? UserId,
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? UserName
) : IMessage<OperationResult<object>>;
