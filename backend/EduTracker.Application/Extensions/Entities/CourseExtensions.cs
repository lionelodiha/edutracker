using EduTracker.Application.Features.Academics.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class CourseExtensions
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
}
