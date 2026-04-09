using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Teachers.JoinTeacher;

public sealed record JoinTeacherCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string StaffId
) : IMessage<OperationResult<Guid>>;
