using EduTracker.Application.CQRS.Messaging;

namespace EduTracker.Application.Features.Auth.Register;

public record RegisterUserCommand(
    string FirstName,
    string MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password
) : IRequest<Guid>;
