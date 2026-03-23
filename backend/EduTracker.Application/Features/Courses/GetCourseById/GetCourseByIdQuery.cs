using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Courses.GetCourseById;

public sealed record GetCourseByIdQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid CourseId
) : IMessage<OperationResult<CourseResponse>>;
