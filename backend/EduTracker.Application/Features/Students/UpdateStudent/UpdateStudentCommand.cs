using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Students.UpdateStudent;

public sealed record UpdateStudentCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid StudentId,
    string StudentNumber,
    Guid? ClassId
) : IMessage<OperationResult<object>>;
