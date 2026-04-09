namespace EduTracker.Application.Features.Models;

public sealed record StudentResponse(
    Guid Id,
    Guid UserId,
    string UserName,
    string FirstName,
    string LastName,
    string StudentNumber,
    Guid OrganizationId,
    Guid OrganizationMemberId,
    Guid? ClassId,
    string? ClassName,
    DateTime JoinedAt
);
