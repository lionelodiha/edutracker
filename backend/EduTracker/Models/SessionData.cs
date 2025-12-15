namespace EduTracker.Models;

public class SessionData
{
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public string[] Roles { get; set; }
    public DateTimeOffset ExpiresUtc { get; set; }
    public bool IsRevoked { get; set; }
}