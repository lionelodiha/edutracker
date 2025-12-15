using EduTracker.Models;

namespace EduTracker.Interfaces.Services;

public interface ISessionService
{
    Task<SessionData> ValidateAsync(Guid sessionId);
    Task<SessionData> CreateAsync(Guid userId, string[] roles, TimeSpan lifetime);
    Task RevokeAsync(Guid sessionId);
}