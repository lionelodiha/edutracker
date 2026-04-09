namespace EduTracker.Application.Features.Models;

public sealed record TeacherResponse(
    Guid Id,
    Guid UserId,
    string UserName,
    string FirstName,
    string LastName,
    string StaffId,
    Guid OrganizationId,
    Guid OrganizationMemberId,
    DateTime JoinedAt
);
