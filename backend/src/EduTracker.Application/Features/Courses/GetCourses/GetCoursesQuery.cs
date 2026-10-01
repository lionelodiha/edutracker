using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Courses.GetCourses;

public sealed record GetCoursesQuery(
    Guid? UserId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<CourseResponse>>>;
