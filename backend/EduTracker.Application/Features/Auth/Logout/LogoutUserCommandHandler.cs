using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.Logout;

public class LogoutUserCommandHandler(SessionManagementService sessionManagementService)
    : IHandler<LogoutUserCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(LogoutUserCommand message, CancellationToken cancellationToken = default)
    {
        await sessionManagementService.DeleteSessionAsync(message.SessionId, cancellationToken);

        return ResponseCatalog.Auth.LogoutSuccessful
            .As<object>()
            .ToOperationResult();
    }
}
