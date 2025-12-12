using EduTracker.Common.Entities;

namespace EduTracker.Models;

public class UserSessionSensitive : ISensitiveData
{
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }
}
