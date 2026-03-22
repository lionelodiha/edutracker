namespace EduTracker.Application.Features.Academics.Models;

public sealed record SemesterResponse(
    Guid Id,
    string Session,
    Guid OrganizationId,
    DateTime CreatedAt
);
