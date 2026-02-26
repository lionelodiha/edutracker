using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Configurations.Security;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Auth.Extensions;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Auth.RefreshSession;

internal sealed class RefreshSessionCommandHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IOptions<SessionLifetimeOptions> sessionLifeTimeOptions
) : IHandler<RefreshSessionCommand, OperationResult<SessionResult>>
{
    public async Task<OperationResult<SessionResult>> Handle(RefreshSessionCommand message, CancellationToken cancellationToken = default)
    {
        if (message.SessionId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        Guid sessionId = message.SessionId.Value;
        string cacheKey = CacheKeys.SessionById(sessionId);
        SessionData? cachedSession = await cacheService.GetAsync<SessionData>(cacheKey);

        SessionLifetimeOptions sessionOpts = sessionLifeTimeOptions.Value;

        if (cachedSession is not null)
        {
            if (cachedSession.IsExpired())
                throw ResponseCatalog.Auth.InvalidSession.ToException();

            if (!cachedSession.ShouldRefresh(sessionOpts.ExpiryExtensionTriggerPercent))
            {
                SessionResult resultData = new(cachedSession.SessionId, cachedSession.ToTimestampsResponse());

                return ResponseCatalog.Auth.SessionRefreshed
                    .As<SessionResult>()
                    .WithData(resultData)
                    .ToOperationResult();
            }
        }

        UserSession? session = await db.UserSessions
            .Where(s => s.Id == sessionId)
            .FirstOrDefaultAsync(cancellationToken);

        if (session is null || session.IsExpired())
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (session.ShouldRefresh(sessionOpts.ExpiryExtensionTriggerPercent))
        {
            TimeSpan extension = session.RememberMe
                ? sessionOpts.ExtendedExpiryExtension
                : sessionOpts.StandardExpiryExtension;

            session.ExtendSession(extension);
            await db.SaveChangesAsync(cancellationToken);

            SessionData sessionData = session.ToSessionData();
            TimeSpan cacheTtl = SessionHelper.CalculateCacheTimeToLive(
                sessionData.ExpiresAt,
                cacheTtlOptions.Value.AuthSessionByIdTtl
            );

            await cacheService.SetAsync(cacheKey, sessionData, cacheTtl);

            SessionResult data = new(sessionData.SessionId, sessionData.ToTimestampsResponse());

            return ResponseCatalog.Auth.SessionRefreshed
                .As<SessionResult>()
                .WithData(data)
                .ToOperationResult();
        }

        SessionData currentSessionData = session.ToSessionData();
        TimeSpan currentTtl = SessionHelper.CalculateCacheTimeToLive(
            currentSessionData.ExpiresAt,
            cacheTtlOptions.Value.AuthSessionByIdTtl
        );

        await cacheService.SetAsync(cacheKey, currentSessionData, currentTtl);

        SessionResult currentData = new(currentSessionData.SessionId, currentSessionData.ToTimestampsResponse());

        return ResponseCatalog.Auth.SessionRefreshed
            .As<SessionResult>()
            .WithData(currentData)
            .ToOperationResult();
    }
}
