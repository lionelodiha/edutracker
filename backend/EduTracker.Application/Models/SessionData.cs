namespace EduTracker.Application.Models;

public sealed record SessionData(
    Guid SessionId,
    Guid UserId,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime AbsoluteExpiresAt,
    bool IsRevoked,
    bool RememberMe
)
{
    public bool IsExpired()
    {
        DateTime now = DateTime.UtcNow;
        return now >= ExpiresAt || now >= AbsoluteExpiresAt || IsRevoked;
    }

    public bool ShouldRefresh(float thresholdPercent)
    {
        if (thresholdPercent < 1 || thresholdPercent > 100)
            throw new ArgumentOutOfRangeException(nameof(thresholdPercent), "Threshold percent must be between 1 and 100.");

        double thresholdFraction = thresholdPercent / 100;

        if (IsRevoked)
            return false;

        DateTime now = DateTime.UtcNow;

        if (now >= AbsoluteExpiresAt)
            return false;

        TimeSpan remaining = ExpiresAt - now;
        TimeSpan total = ExpiresAt - CreatedAt;

        if (total <= TimeSpan.Zero)
            return true;

        double remainingPercent = remaining.TotalSeconds / total.TotalSeconds;
        return remainingPercent <= thresholdFraction;
    }
}
