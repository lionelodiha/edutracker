using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Sessions.RevokeUserSession;

public sealed class RevokeUserSessionCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<RevokeUserSessionCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(RevokeUserSessionCommand message, CancellationToken cancellationToken = default)
    {
        if (!message.SessionId.HasValue)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (message.ActorId != message.UserId)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        UserSession? session = await db.UserSessions
            .FirstOrDefaultAsync(s => s.Id == message.SessionId && !s.IsRevoked, cancellationToken);

        if (session is null)
            return ResponseCatalog.Auth.SessionRevoked.ToOperationResult();

        session.Revoke();

        await db.SaveChangesAsync(cancellationToken);
        await cacheService.RemoveAsync(CacheKeys.SessionById(message.SessionId.Value));

        return ResponseCatalog.Auth.SessionRevoked.ToOperationResult();
    }
}
