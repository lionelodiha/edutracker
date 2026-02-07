using EduTracker.Application.Features.Enrollments.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class EnrollmentExtensions
{
    extension(ClassEnrollment enrollment)
    {
        public ClassEnrollmentResponse ToEnrollmentResponse()
            => new(
                enrollment.Id,
                enrollment.ClassId,
                enrollment.StudentMemberId,
                enrollment.EnrolledAt
            );
    }
}
