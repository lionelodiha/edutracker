using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Courses.UpdateCourse;

public sealed record UpdateCourseCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid CourseId,
    string Name,
    string Code
) : IMessage<OperationResult<object>>;
