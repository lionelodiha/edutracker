using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.UserSessions;

public class UserSessionSensitive : ISensitiveData
{
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }
}
