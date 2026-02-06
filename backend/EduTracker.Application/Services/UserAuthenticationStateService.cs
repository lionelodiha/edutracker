using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Services;

public sealed class UserAuthenticationStateService(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
)
{
    public async Task<UserAuthData?> GetUserAuthDataAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        string cacheKey = CacheKeys.UserAuthenticationState(userId);
        UserAuthData? cachedData = await cacheService.GetAsync<UserAuthData>(cacheKey);

        if (cachedData is not null) return cachedData;

        UserAuthData? userAuthData = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserAuthData(
                u.Id,
                u.Role,
                u.IsLocked
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (userAuthData is null) return null;

        await cacheService.SetAsync(cacheKey, userAuthData, cacheTtlOptions.Value.AuthSessionByIdTtl);

        return userAuthData;
    }
}
