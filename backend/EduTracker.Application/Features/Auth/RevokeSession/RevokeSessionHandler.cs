using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.RevokeSession;

public class RevokeSessionHandler(SessionManagementService sessionService)
    : IHandler<RevokeSessionRequest, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(RevokeSessionRequest request, CancellationToken cancellationToken = default)
    {
        if (request.SessionId.HasValue)
            await sessionService.RevokeSessionAsync(request.SessionId.Value, cancellationToken);

        return ResponseCatalog.Auth.SessionRevoked
            .As<object>()
            .ToOperationResult();
    }
}
