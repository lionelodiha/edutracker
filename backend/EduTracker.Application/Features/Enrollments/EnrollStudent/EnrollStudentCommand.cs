using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Enrollments.EnrollStudent;

public sealed record EnrollStudentCommand(
    Guid? ActorId,
    Guid ClassId,
    Guid StudentMemberId
) : IMessage<OperationResult<Guid>>;
