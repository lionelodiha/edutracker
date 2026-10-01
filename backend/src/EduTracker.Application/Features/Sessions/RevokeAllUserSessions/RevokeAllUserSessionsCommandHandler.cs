using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Sessions.RevokeAllUserSessions;

internal sealed class RevokeAllUserSessionsCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<RevokeAllUserSessionsCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(RevokeAllUserSessionsCommand message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (message.ActorId != message.UserId)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        IQueryable<UserSession> query = db.UserSessions
            .Where(s => s.UserId == message.UserId && !s.IsRevoked);

        if (message.SessionId.HasValue)
            query = query.Where(s => s.Id != message.SessionId.Value);

        List<UserSession> sessions = await query.ToListAsync(cancellationToken);

        if (sessions.Count > 0)
        {
            foreach (UserSession session in sessions)
                session.Revoke();

            await db.SaveChangesAsync(cancellationToken);

            foreach (UserSession session in sessions)
                await cacheService.RemoveAsync(CacheKeys.SessionById(session.Id));
        }

        return ResponseCatalog.Auth.SessionRevoked.ToOperationResult();
    }
}
