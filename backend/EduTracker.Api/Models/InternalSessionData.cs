using EduTracker.Domain.Enums;

namespace EduTracker.Api.Models;

internal sealed record InternalSessionData(
    Guid UserId,
    SystemRole Role
);
