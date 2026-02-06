using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.RegisterUser;

public sealed record RegisterUserCommand(
    string FirstName,
    string? MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password
) : IMessage<OperationResult<Guid>>;
