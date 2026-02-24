namespace EduTracker.Api.Models;

internal sealed record InternalSessionData(
    Guid UserId,
    UserRole Role
);
