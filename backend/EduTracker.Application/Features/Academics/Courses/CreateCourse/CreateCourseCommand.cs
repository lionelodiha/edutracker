using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Courses.CreateCourse;

public sealed record CreateCourseCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string Name,
    string Code
) : IMessage<OperationResult<Guid>>;
