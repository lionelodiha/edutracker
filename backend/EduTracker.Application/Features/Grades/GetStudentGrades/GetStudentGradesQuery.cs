using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Grades.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Grades.GetStudentGrades;

public sealed record GetStudentGradesQuery(
    Guid? ActorId,
    Guid StudentMemberId
) : IMessage<OperationResult<IReadOnlyList<GradeResponse>>>;
