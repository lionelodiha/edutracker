using EduTracker.Application.Features.Courses.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class CourseExtensions
{
    extension(Course course)
    {
        public CourseResponse ToCourseResponse()
            => new(
                course.Id,
                course.OrganizationId,
                course.Name,
                course.Description
            );
    }
}
