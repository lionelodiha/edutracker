using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;

namespace EduTracker.Application.Features.Auth.Logout;

public record LogoutUserCommand(
    Guid SessionId
) : IRequest<OperationResult<object>>;

public class LogoutUserCommandHandler(AppDbContext db, SessionManagementService sessionManagementService)
    : IHandler<LogoutUserCommand, OperationResult<object>>
{
    public Task<OperationResult<object>> Handle(LogoutUserCommand message, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}
