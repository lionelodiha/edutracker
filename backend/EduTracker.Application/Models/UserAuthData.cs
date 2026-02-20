using EduTracker.Domain.Enums;

namespace EduTracker.Application.Models;

public sealed record UserAuthData(
    Guid UserId,
    IReadOnlyList<string> Roles,
    bool IsLocked
);
