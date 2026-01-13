using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.Logout;

public class LogoutUserHandler(SessionManagementService sessionService)
    : IHandler<LogoutUserRequest, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(LogoutUserRequest message, CancellationToken cancellationToken = default)
    {
        if (message.SessionId.HasValue)
            await sessionService.RevokeSessionAsync(message.SessionId.Value, cancellationToken);

        return ResponseCatalog.Auth.LogoutSuccessful
            .As<object>()
            .ToOperationResult();
    }
}
