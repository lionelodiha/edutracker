namespace EduTracker.Application.Helpers;

internal static class SessionHelper
{
    public static TimeSpan CalculateCacheTimeToLive(DateTime expiresAtUtc, TimeSpan maxTimeToLive)
    {
        TimeSpan remaining = expiresAtUtc - DateTime.UtcNow;

        if (remaining <= TimeSpan.Zero)
            return TimeSpan.Zero;

        return remaining < maxTimeToLive ? remaining : maxTimeToLive;
    }
}
