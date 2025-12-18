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

public class LoginUserCommandHandler(AppDbContext db, IHashingService hashingService, ICacheService cacheService)
    : IHandler<LoginUserCommand, OperationResult<SessionData>>
{
    private readonly AppDbContext _db = db;
    private readonly IHashingService _hashingService = hashingService;
    private readonly ICacheService _cacheService = cacheService;

    public async Task<OperationResult<SessionData>> Handle(LoginUserCommand message, CancellationToken cancellationToken = default)
    {
        string identifier = message.Identifier.Trim();
        bool isEmail = identifier.Contains('@');

        IQueryable<User> query = _db.Users.AsQueryable();

        query = isEmail
            ? query.Where(u => u.EmailHash == _hashingService.HashEmail(identifier.ToLowerInvariant()))
            : query.Where(u => u.UserName == identifier);

        var userData = await query
            .Select(u => new { u.Id, u.PasswordHash, u.Role })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        bool passwordValid = _hashingService.VerifyPassword(message.Password, userData.PasswordHash);

        if (!passwordValid)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        TimeSpan sessionDuration = message.RememberMe
            ? TimeSpan.FromDays(30)
            : TimeSpan.FromHours(8);

        UserSession session = new(
            userId: userData.Id,
            sessionDuration: sessionDuration
        );

        _db.UserSessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        SessionData data = new(
            SessionId: session.Id,
            UserId: session.UserId,
            ExpiresAt: session.ExpiresAt,
            IsRevoked: session.IsRevoked,
            Role: userData.Role
        );

        string cacheKey = $"{CacheKeys.Session}{session.UserId:N}";
        await _cacheService.SetAsync(cacheKey, data, TimeSpan.FromMinutes(15));

        return ResponseCatalog.Auth.LoginSuccessful
            .As<SessionData>()
            .WithData(data)
            .ToOperationResult();
    }
}
