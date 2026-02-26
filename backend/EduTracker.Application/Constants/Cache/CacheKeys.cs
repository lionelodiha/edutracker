namespace EduTracker.Application.Constants.Cache;

internal static class CacheKeys
{
    public static string SessionById(Guid sessionId)
        => $"edu:session:id:{sessionId:N}";

    public static string UserAuthenticationState(Guid userId)
        => $"edu:auth:user:authentication:{userId:N}";

    public static string UserProfileById(Guid userId)
        => $"edu:user:profile:by-id:{userId:N}";
}
