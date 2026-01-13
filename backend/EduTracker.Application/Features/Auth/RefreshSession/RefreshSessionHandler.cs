using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Auth.Extensions;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.RefreshSession;

public class RefreshSessionHandler(SessionManagementService sessionService)
    : IHandler<RefreshSessionRequest, OperationResult<SessionResult>>
{
    public async Task<OperationResult<SessionResult>> Handle(RefreshSessionRequest message, CancellationToken cancellationToken = default)
    {
        if (message.SessionId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        SessionData sessionData = await sessionService
            .ExtendSessionAsync(message.SessionId.Value, cancellationToken)
            ?? throw ResponseCatalog.Auth.InvalidSession.ToException();

        SessionTimestampsResponse timeStamps = sessionData.ToTimestampsResponse();
        SessionResult data = new(sessionData.SessionId, timeStamps);

        return ResponseCatalog.Auth.SessionRefreshed
            .As<SessionResult>()
            .WithData(data)
            .ToOperationResult();
    }
}
