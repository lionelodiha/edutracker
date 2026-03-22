namespace EduTracker.Application.Features.Academics.Models;

public sealed record CourseOfferingResponse(
    Guid Id,
    Guid CourseId,
    string CourseName,
    string CourseCode,
    Guid SemesterId,
    string Session,
    Guid OrganizationId,
    DateTime CreatedAt
);
