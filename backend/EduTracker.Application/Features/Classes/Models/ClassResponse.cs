namespace EduTracker.Application.Features.Classes.Models;

public sealed record ClassResponse(
    Guid Id,
    Guid OrganizationId,
    Guid CourseId,
    Guid TeacherMemberId,
    string Term,
    int Year
);
