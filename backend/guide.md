Below is a **practical step-by-step implementation guide** for using a **structured cache TTL configuration** in a .NET application (ASP.NET Core / Clean Architecture style).

This guide covers:

1. Configuration structure
2. Options classes
3. Registering options
4. Using TTL values in services
5. Example cache service usage
6. Best practices

---

# 1️⃣ Define the Configuration Structure

Add this to **appsettings.json**.

```json
{
  "CacheTimeToLiveOptions": {
    "AuthSessionById": {
      "Minutes": 10
    },
    "UserAuthenticationState": {
      "Minutes": 10
    },
    "UserProfileById": {
      "Minutes": 5
    }
  }
}
```

This structure makes cache settings **easy to expand later**.

Example future upgrade:

```json
"AuthSessionById": {
  "Minutes": 10,
  "Sliding": true
}
```

---

# 2️⃣ Create the Options Classes

Location (recommended):

```
Application/
 └── Configurations/
      └── Caching/
           ├── CacheTimeToLiveOptions.cs
           └── CacheOptions.cs
```

---

## CacheOptions.cs

```csharp
namespace EduTracker.Application.Configurations.Caching;

public sealed record CacheOptions
{
    public int Minutes { get; init; }

    public TimeSpan Ttl => TimeSpan.FromMinutes(Minutes);
}
```

---

## CacheTimeToLiveOptions.cs

```csharp
namespace EduTracker.Application.Configurations.Caching;

public sealed record CacheTimeToLiveOptions
{
    public CacheOptions AuthSessionById { get; init; } = default!;

    public CacheOptions UserAuthenticationState { get; init; } = default!;

    public CacheOptions UserProfileById { get; init; } = default!;
}
```

---

# 3️⃣ Register the Options in Dependency Injection

Inside **Program.cs** or your **DependencyInjection.cs**.

```csharp
builder.Services.Configure<CacheTimeToLiveOptions>(
    builder.Configuration.GetSection("CacheTimeToLiveOptions"));
```

Or if using a clean architecture **Infrastructure registration**:

```csharp
services.Configure<CacheTimeToLiveOptions>(
    configuration.GetSection("CacheTimeToLiveOptions"));
```

---

# 4️⃣ Inject the Options Where Needed

Use `IOptions<CacheTimeToLiveOptions>`.

Example inside a service.

```csharp
using Microsoft.Extensions.Options;

public class AuthSessionService
{
    private readonly CacheTimeToLiveOptions _cacheOptions;

    public AuthSessionService(IOptions<CacheTimeToLiveOptions> options)
    {
        _cacheOptions = options.Value;
    }

    public TimeSpan GetSessionTtl()
    {
        return _cacheOptions.AuthSessionById.Ttl;
    }
}
```

---

# 5️⃣ Example Usage with IMemoryCache

```csharp
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

public class UserProfileCacheService
{
    private readonly IMemoryCache _cache;
    private readonly CacheTimeToLiveOptions _ttl;

    public UserProfileCacheService(
        IMemoryCache cache,
        IOptions<CacheTimeToLiveOptions> ttlOptions)
    {
        _cache = cache;
        _ttl = ttlOptions.Value;
    }

    public async Task<UserProfile?> GetAsync(Guid userId, Func<Task<UserProfile>> factory)
    {
        var cacheKey = $"user-profile:{userId}";

        if (_cache.TryGetValue(cacheKey, out UserProfile profile))
            return profile;

        profile = await factory();

        _cache.Set(
            cacheKey,
            profile,
            _ttl.UserProfileById.Ttl);

        return profile;
    }
}
```

---

# 6️⃣ Example Usage with Distributed Cache (Redis)

```csharp
public async Task SetUserProfileAsync(Guid userId, UserProfile profile)
{
    var cacheKey = $"user-profile:{userId}";

    var options = new DistributedCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow =
            _ttl.UserProfileById.Ttl
    };

    await _cache.SetStringAsync(
        cacheKey,
        JsonSerializer.Serialize(profile),
        options);
}
```

---

# 7️⃣ Best Practices

### ✔ Use Explicit Names

Good:

```
AuthSessionById
UserProfileById
```

Bad:

```
Auth
User
```

Explicit keys prevent confusion.

---

### ✔ Always Convert to `TimeSpan` in Code

Config should stay **simple**:

```
Minutes
```

Code should convert:

```
TimeSpan.FromMinutes()
```

---

### ✔ Keep TTL Config in One Place

All TTL values in:

```
CacheTimeToLiveOptions
```

This prevents magic numbers like:

```csharp
TimeSpan.FromMinutes(10)
```

scattered in services.

---

### ✔ Use a Consistent Cache Key Format

Example pattern:

```
{entity}:{identifier}
```

Examples:

```
auth-session:{sessionId}
user-profile:{userId}
user-auth-state:{userId}
```

---

# 8️⃣ Final Project Structure

Recommended layout:

```
Application
 └── Configurations
      └── Caching
           ├── CacheOptions.cs
           └── CacheTimeToLiveOptions.cs

Infrastructure
 └── Caching
      └── UserProfileCacheService.cs

API
 └── Program.cs
```

---

# ⭐ Bonus (Highly Recommended)

Create **constants for cache keys**.

Example:

```csharp
public static class CacheKeys
{
    public const string UserProfile = "user-profile";
    public const string AuthSession = "auth-session";
}
```

Then:

```csharp
var key = $"{CacheKeys.UserProfile}:{userId}";
```

Prevents typos across the codebase.

---

✅ If you want, I can also show you a **very clean enterprise caching pattern used in large .NET systems**:

* **ICacheService abstraction**
* **CacheKey factory**
* **central TTL policies**
* works with **MemoryCache + Redis**

It makes caching **10x cleaner in large projects.**
