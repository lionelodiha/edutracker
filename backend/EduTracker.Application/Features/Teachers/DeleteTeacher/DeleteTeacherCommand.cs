using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Teachers.DeleteTeacher;

public sealed record DeleteTeacherCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid TeacherId
) : IMessage<OperationResult<object>>;
