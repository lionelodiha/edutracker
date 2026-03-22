using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Courses.DeleteCourse;

public sealed record DeleteCourseCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid CourseId
) : IMessage<OperationResult<object>>;
