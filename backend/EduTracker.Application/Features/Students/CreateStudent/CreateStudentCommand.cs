using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Students.CreateStudent;

public sealed record CreateStudentCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid UserId,
    string StudentNumber,
    Guid? ClassId
) : IMessage<OperationResult<Guid>>;
