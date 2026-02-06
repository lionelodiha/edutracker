using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Users.DemoteUser;

public sealed class DemoteUserCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DemoteUserCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DemoteUserCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var cachedUserAuth = await cacheService.GetAsync<UserAuthData>(
            CacheKeys.UserAuthenticationState(message.ActorId.Value)
        );

        SystemRole? actorRole = cachedUserAuth?.Role;

        actorRole ??= await db.Users
            .AsNoTracking()
            .Where(u => u.Id == message.ActorId)
            .Select(u => (SystemRole?)u.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (actorRole is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (message.ActorId == message.TargetId)
            throw ResponseCatalog.Authorization.CannotActOnSelf.ToException();

        if (actorRole is not SystemRole.SuperAdmin)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        User? targetUser = await db.Users
            .FirstOrDefaultAsync(u => u.Id == message.TargetId, cancellationToken)
            ?? throw ResponseCatalog.User.NotFound.ToException();

        SystemRole newRole;

        if (targetUser.Role is SystemRole.SuperAdmin)
        {
            throw ResponseCatalog.Authorization.CannotDemoteSuperAdmin.ToException();
        }
        else if (targetUser.Role is SystemRole.Admin)
        {
            newRole = SystemRole.User;
        }
        else
        {
            throw ResponseCatalog.User.AlreadyBottomRole.ToException();
        }

        targetUser.UpdateRole(newRole);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.UserProfileById(targetUser.Id));
        await cacheService.RemoveAsync(CacheKeys.UserAuthenticationState(targetUser.Id));

        return ResponseCatalog.User.Demoted.ToOperationResult();
    }
}
