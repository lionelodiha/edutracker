using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Assignments.CreateAssignment;

public sealed record CreateAssignmentCommand(
    Guid? ActorId,
    Guid ClassId,
    string Title,
    double MaxScore,
    DateTime? DueDate
) : IMessage<OperationResult<Guid>>;
