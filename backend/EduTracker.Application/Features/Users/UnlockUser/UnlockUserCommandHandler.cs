using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Users.UnlockUser;

public sealed class UnlockUserCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UnlockUserCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UnlockUserCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var cachedUserAuth = await cacheService.GetAsync<UserAuthData>(
            CacheKeys.UserAuthenticationState(message.ActorId.Value)
        );

        IReadOnlyList<string>? actorRoles = cachedUserAuth?.Roles;

        if (actorRoles is null)
        {
            actorRoles = await db.Users
                .AsNoTracking()
                .Where(u => u.Id == message.ActorId)
                .SelectMany(u => u.RoleAssignments
                    .Where(ra => ra.IsActive)
                    .Select(ra => ra.Role.Key))
                .ToListAsync(cancellationToken);
        }

        if (actorRoles is null || actorRoles.Count == 0)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (!actorRoles.Contains(RoleKeys.Admin) && !actorRoles.Contains(RoleKeys.SuperAdmin))
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        User targetUser = await db.Users
            .FirstOrDefaultAsync(u => u.Id == message.TargetId, cancellationToken)
            ?? throw ResponseCatalog.User.NotFound.ToException();

        targetUser.Unlock();
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.UserAuthenticationState(targetUser.Id));

        return ResponseCatalog.User.Unlocked.ToOperationResult();
    }
}
