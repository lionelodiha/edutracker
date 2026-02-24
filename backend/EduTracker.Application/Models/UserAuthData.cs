namespace EduTracker.Application.Models;

public sealed record UserAuthData(
    Guid UserId,
    UserRole Role,
    bool IsLocked
);
