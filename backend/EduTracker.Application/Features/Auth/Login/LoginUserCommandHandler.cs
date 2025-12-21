using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Entities.UserSessions;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Auth.Login;

public class LoginUserCommandHandler(AppDbContext db, IHashingService hashingService, ICacheService cacheService, SessionPolicy sessionLifetime)
    : IHandler<LoginUserCommand, OperationResult<SessionData>>
{
    public async Task<OperationResult<SessionData>> Handle(LoginUserCommand message, CancellationToken cancellationToken = default)
    {
        string identifier = message.Identifier.Trim();
        bool isEmail = identifier.Contains('@');

        IQueryable<User> query = db.Users.AsQueryable();

        query = isEmail
            ? query.Where(u => u.EmailHash == hashingService.HashEmail(identifier.ToLowerInvariant()))
            : query.Where(u => u.UserName == identifier);

        var userData = await query
            .Select(u => new { u.Id, u.PasswordHash, u.Role })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        bool passwordValid = await hashingService.VerifyPasswordAsync(message.Password, userData.PasswordHash);

        if (!passwordValid)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        UserSession session = new(
            userId: userData.Id,
            // initialLifetime: sessionLifetime.ResolveSession(message.RememberMe),
            initialLifetime: TimeSpan.FromDays(7),
            absoluteLifetime: TimeSpan.FromDays(90)
        );

        db.UserSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        SessionData data = new(
            SessionId: session.Id,
            UserId: session.UserId,
            ExpiresAt: session.ExpiresAt,
            IsRevoked: session.IsRevoked,
            Role: userData.Role
        );

        string cacheKey = $"{CacheKeys.Session}{session.UserId:N}";
        TimeSpan cacheDuration = TimeSpan.FromDays(1);
        await cacheService.SetAsync(cacheKey, data, cacheDuration);

        return ResponseCatalog.Auth.LoginSuccessful
            .As<SessionData>()
            .WithData(data)
            .ToOperationResult();
    }
}
