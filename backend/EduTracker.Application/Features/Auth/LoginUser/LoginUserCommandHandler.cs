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

namespace EduTracker.Application.Features.Auth.LoginUser;

public sealed class LoginUserCommandHandler(
    AppDbContext db,
    IHashingService hashingService,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IOptions<SessionLifetimeOptions> sessionLifetimeOptions
) : IHandler<LoginUserCommand, OperationResult<SessionResult>>
{
    public async Task<OperationResult<SessionResult>> Handle(LoginUserCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActiveSessionId.HasValue)
        {
            UserSession? activeSession = await db.UserSessions
                .FirstOrDefaultAsync(s => s.Id == message.ActiveSessionId && !s.IsRevoked, cancellationToken);

            activeSession?.Revoke();

            await cacheService.RemoveAsync(CacheKeys.SessionById(message.ActiveSessionId.Value));
        }

        string emailHash = hashingService.HashEmail(message.Identifier);

        var userDto = await db.Users
            .AsNoTracking()
            .Where(u => u.EmailHash == emailHash || u.UserName == message.Identifier)
            .Select(u => new
            {
                u.Id,
                u.PasswordHash,
                u.IsLocked,
                Roles = u.RoleAssignments
                    .Where(ra => ra.IsActive && !ra.IsExpired())
                    .Select(ra => ra.Role.Key)
                    .ToList(),
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        if (userDto.IsLocked)
            throw ResponseCatalog.Authorization.AccountLocked.ToException();

        bool isPasswordValid = await hashingService.VerifyPasswordAsync(message.Password, userDto.PasswordHash);

        if (!isPasswordValid)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        SessionLifetimeOptions sessionLifetimeOpts = sessionLifetimeOptions.Value;

        TimeSpan initialLifetime = message.RememberMe
            ? sessionLifetimeOpts.ExtendedSessionDuration
            : sessionLifetimeOpts.StandardSessionDuration;

        UserSession session = new(
            userId: userDto.Id,
            rememberMe: message.RememberMe,
            slidingLifetime: initialLifetime,
            absoluteLifetime: sessionLifetimeOpts.AbsoluteSessionLimit
        );

        db.UserSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        SessionData sessionData = session.ToSessionData();
        string cacheKey = CacheKeys.SessionById(session.Id);
        TimeSpan cacheTtl = SessionHelper.CalculateCacheTimeToLive(session.ExpiresAt, cacheTtlOptions.Value.AuthSessionByIdTtl);

        await cacheService.SetAsync(cacheKey, sessionData, cacheTtl);

        SessionTimestampsResponse timeStamps = session.ToTimestampsResponse();
        SessionResult data = new(session.Id, timeStamps);

        return ResponseCatalog.Auth.LoginSuccessful
            .As<SessionResult>()
            .WithData(data)
            .ToOperationResult();
    }
}
