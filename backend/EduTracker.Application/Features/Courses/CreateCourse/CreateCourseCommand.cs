using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Courses.CreateCourse;

public sealed record CreateCourseCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string Name,
    string? Description
) : IMessage<OperationResult<Guid>>;
