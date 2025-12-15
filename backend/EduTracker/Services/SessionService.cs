using System.Text.Json;
using EduTracker.Data;
using EduTracker.Interfaces.Services;
using EduTracker.Models;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Services;

public class SessionService(AppDbContext db, ICacheService cache) : ISessionService
{
    private readonly AppDbContext _db = db;
    private readonly ICacheService _cache = cache;
    private const string CachePrefix = "sess:";

    public async Task<SessionData> ValidateAsync(Guid sessionId)
    {
        var cacheKey = CachePrefix + sessionId.ToString("N");

        // Try cache first
        if (await _cache.ExistsAsync(cacheKey))
        {
            var json = await _cache.GetAsync<SessionData>(cacheKey);
            var cached = json;
            if (cached != null && !cached.IsRevoked && cached.ExpiresUtc > DateTime.UtcNow)
                return cached;
        }

        // Fallback to DB
        var entity = await _db.UserSessions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == sessionId);
        if (entity == null || entity.IsRevoked || entity.ExpiresAt <= DateTime.UtcNow)
            return null;

        var data = new SessionData
        {
            SessionId = entity.Id,
            UserId = entity.UserId,
            Roles = (entity.User.Role.ToString() ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            ExpiresUtc = entity.ExpiresAt,
            IsRevoked = entity.IsRevoked
        };

        // Refresh cache TTL to remaining lifetime
        var ttl = data.ExpiresUtc - DateTime.UtcNow;
        if (ttl > TimeSpan.Zero)
        {
            var json = JsonSerializer.Serialize(data);
            await _cache.SetAsync(cacheKey, json, ttl);
        }

        return data;
    }

    public async Task<SessionData> CreateAsync(Guid userId, string[] roles, TimeSpan lifetime)
    {
        var now = DateTime.UtcNow;

        var entity = new UserSession(userId, lifetime, Enums.DeviceType.Unknown);


        _db.UserSessions.Add(entity);
        await _db.SaveChangesAsync();

        var data = new SessionData
        {
            SessionId = entity.Id,
            UserId = entity.UserId,
            Roles = roles ?? [],
            ExpiresUtc = entity.ExpiresAt,
            IsRevoked = false
        };

        var ttl = data.ExpiresUtc - now;
        var json = JsonSerializer.Serialize(data);
        await _cache.SetAsync(CachePrefix + entity.Id.ToString("N"), json, ttl);

        return data;
    }

    public async Task RevokeAsync(Guid sessionId)
    {
        var entity = await _db.UserSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (entity == null) return;

        entity.Revoke();
        await _db.SaveChangesAsync();

        await _cache.RemoveAsync(CachePrefix + sessionId.ToString("N"));
    }
}
