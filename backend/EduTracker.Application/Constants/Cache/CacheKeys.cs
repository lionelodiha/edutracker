namespace EduTracker.Application.Constants.Cache;

internal static class CacheKeys
{
    public static string SessionById(Guid sessionId)
        => $"jb:session:id:{sessionId:N}";

    public static string UserAuthenticationState(Guid userId)
        => $"jb:auth:user:authentication:{userId:N}";

    public static string UserProfileById(Guid userId)
        => $"jb:user:profile:by-id:{userId:N}";
}
