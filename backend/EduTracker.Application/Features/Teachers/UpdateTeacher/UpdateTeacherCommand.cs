using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Teachers.UpdateTeacher;

public sealed record UpdateTeacherCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid TeacherId,
    string StaffId
) : IMessage<OperationResult<object>>;
