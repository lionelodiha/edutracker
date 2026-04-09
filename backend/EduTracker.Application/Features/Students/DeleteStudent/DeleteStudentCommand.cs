using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Students.DeleteStudent;

public sealed record DeleteStudentCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid StudentId
) : IMessage<OperationResult<object>>;
