using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Sessions.GetCurrentUserSessions;

internal sealed class GetCurrentUserSessionsQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetCurrentUserSessionsQuery, OperationResult<IReadOnlyList<SessionData>>>
{
    public async Task<OperationResult<IReadOnlyList<SessionData>>> Handle(GetCurrentUserSessionsQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        List<Guid> sessionIds = await db.UserSessions
            .AsNoTracking()
            .Where(s => s.UserId == message.UserId && !s.IsRevoked)
            .OrderByDescending(s => s.AuditState.CreatedAt)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        List<SessionData> sessions = [];
        List<Guid> missingIds = [];

        foreach (Guid sessionId in sessionIds)
        {
            var cachedSession = await cacheService.GetAsync<SessionData>(CacheKeys.SessionById(sessionId));

            if (cachedSession is not null)
            {
                sessions.Add(cachedSession);
            }
            else
            {
                missingIds.Add(sessionId);
            }
        }

        if (missingIds.Count > 0)
        {
            List<SessionData> missingSessions = await db.UserSessions
                .AsNoTracking()
                .Where(s => missingIds.Contains(s.Id))
                .Select(s => new SessionData(
                    SessionId: s.Id,
                    UserId: s.UserId,
                    CreatedAt: s.CreatedAt,
                    ExpiresAt: s.ExpiresAt,
                    AbsoluteExpiresAt: s.AbsoluteExpiresAt,
                    IsRevoked: s.IsRevoked,
                    RememberMe: s.RememberMe
                ))
                .ToListAsync(cancellationToken);

            foreach (SessionData session in missingSessions)
            {
                sessions.Add(session);

                await cacheService.SetAsync(
                    CacheKeys.SessionById(session.SessionId),
                    session,
                    cacheTtlOptions.Value.AuthSessionByIdTtl
                );
            }
        }

        sessions = [.. sessions.OrderByDescending(s => s.CreatedAt)];

        return ResponseCatalog.Session.Retrieved
            .As<IReadOnlyList<SessionData>>()
            .WithData(sessions)
            .ToOperationResult();
    }
}
