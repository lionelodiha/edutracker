using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Entities.UserSessions;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Users.LockUser;

public sealed class LockUserCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<LockUserCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(LockUserCommand request, CancellationToken cancellationToken = default)
    {
        if (request.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var cachedUser = await cacheService.GetAsync<UserResponse>(CacheKeys.UserProfileById(request.ActorId.Value));
        SystemRole? actorRole = cachedUser?.Role;

        actorRole ??= await db.Users
            .AsNoTracking()
            .Where(u => u.Id == request.ActorId)
            .Select(u => (SystemRole?)u.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (actorRole is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (actorRole is SystemRole.User)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        if (request.ActorId == request.TargetId)
            throw ResponseCatalog.Authorization.CannotActOnSelf.ToException();

        User targetUser = await db.Users
            .FirstOrDefaultAsync(u => u.Id == request.TargetId, cancellationToken)
            ?? throw ResponseCatalog.User.NotFound.ToException();

        if (targetUser.Role is SystemRole.SuperAdmin)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        if (actorRole is SystemRole.Admin && targetUser.Role is SystemRole.Admin)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        if (targetUser.IsLocked)
            return ResponseCatalog.User.Locked.ToOperationResult();

        targetUser.Lock();
        await db.SaveChangesAsync(cancellationToken);

        List<UserSession> sessions = await db.UserSessions
            .Where(s => s.UserId == targetUser.Id && !s.IsRevoked)
            .ToListAsync(cancellationToken);

        if (sessions.Count > 0)
        {
            foreach (UserSession session in sessions)
                session.Revoke();

            await db.SaveChangesAsync(cancellationToken);

            foreach (UserSession session in sessions)
                await cacheService.RemoveAsync(CacheKeys.SessionById(session.Id));
        }

        await cacheService.RemoveAsync(CacheKeys.UserAuthenticationState(targetUser.Id));

        return ResponseCatalog.User.Locked.ToOperationResult();
    }
}
