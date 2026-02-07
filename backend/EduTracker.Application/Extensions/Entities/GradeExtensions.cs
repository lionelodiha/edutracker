using EduTracker.Application.Features.Grades.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class GradeExtensions
{
    extension(Grade grade)
    {
        public GradeResponse ToGradeResponse()
            => new(
                grade.Id,
                grade.AssignmentId,
                grade.StudentMemberId,
                grade.Score,
                grade.GradedAt
            );
    }
}
