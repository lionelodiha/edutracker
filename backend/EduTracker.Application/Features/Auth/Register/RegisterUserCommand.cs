using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.Register;

public record RegisterUserCommand(
    string FirstName,
    string MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password
) : IRequest<OperationResult<Guid>>;
