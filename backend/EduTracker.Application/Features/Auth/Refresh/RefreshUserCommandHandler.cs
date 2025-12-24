using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.Refresh;

public class RefreshUserCommandHandler(SessionManagementService sessionManagementService)
    : IHandler<RefreshUserCommand, OperationResult<SessionData>>
{
    public async Task<OperationResult<SessionData>> Handle(RefreshUserCommand message, CancellationToken cancellationToken = default)
    {
        bool isValid = await sessionManagementService.ValidateAsync(message.SessionId, cancellationToken);

        if (!isValid)
            throw ResponseCatalog.Auth.SessionNotFound.ToException();

        await sessionManagementService.TryExtendSessionAsync(message.SessionId, cancellationToken);

        SessionData? sessionData = await sessionManagementService.GetSessionDataAsync(message.SessionId, cancellationToken)
            ?? throw ResponseCatalog.Auth.SessionStateInvalid.ToException();

        return ResponseCatalog.Auth.SessionRefreshed
            .As<SessionData>()
            .WithData(sessionData)
            .ToOperationResult();
    }
}
