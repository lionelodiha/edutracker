using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Teachers.CreateTeacher;

public sealed record CreateTeacherCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid UserId,
    string StaffId
) : IMessage<OperationResult<Guid>>;
