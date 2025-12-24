using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.Refresh;

public class RefreshUserCommandHandler(SessionManagementService sessionManagementService)
    : IHandler<RefreshUserCommand, OperationResult<SessionData>>
{
    public async Task<OperationResult<SessionData>> Handle(RefreshUserCommand message, CancellationToken cancellationToken)
    {
        SessionData? sessionData = await sessionManagementService.RefreshSessionAsync(message.SessionId, cancellationToken)
            ?? throw ResponseCatalog.Auth.SessionStateInvalid.ToException();

        return ResponseCatalog.Auth.SessionRefreshed
            .As<SessionData>()
            .WithData(sessionData)
            .ToOperationResult();
    }
}
