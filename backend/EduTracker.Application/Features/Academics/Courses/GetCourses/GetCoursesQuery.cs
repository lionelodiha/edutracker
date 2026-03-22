using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Courses.GetCourses;

public sealed record GetCoursesQuery(
    Guid? UserId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<CourseResponse>>>;
