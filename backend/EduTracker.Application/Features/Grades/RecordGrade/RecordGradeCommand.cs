using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Grades.RecordGrade;

public sealed record RecordGradeCommand(
    Guid? ActorId,
    Guid AssignmentId,
    Guid StudentMemberId,
    double Score
) : IMessage<OperationResult<Guid>>;
