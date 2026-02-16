namespace EduTracker.Application.Features.Enrollments.Models;

public sealed record ClassEnrollmentResponse(
    Guid Id,
    Guid ClassId,
    Guid StudentMemberId,
    DateTime EnrolledAt
);
