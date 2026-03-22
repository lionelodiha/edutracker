using EduTracker.Application.Features.Academics.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class AcademicExtensions
{
    extension(Course course)
    {
        public CourseResponse ToCourseResponse() => new(
            course.Id,
            course.Name,
            course.Code,
            course.OrganizationId,
            course.CreatedAt
        );
    }

    extension(Semester semester)
    {
        public SemesterResponse ToSemesterResponse() => new(
            semester.Id,
            semester.Session,
            semester.OrganizationId,
            semester.CreatedAt
        );
    }
}
