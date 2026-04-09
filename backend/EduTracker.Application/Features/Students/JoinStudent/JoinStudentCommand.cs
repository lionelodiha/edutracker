using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Students.JoinStudent;

public sealed record JoinStudentCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string StudentNumber,
    Guid? ClassId
) : IMessage<OperationResult<Guid>>;
