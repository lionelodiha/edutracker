using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Semesters.DeleteSemester;

public sealed record DeleteSemesterCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid SemesterId
) : IMessage<OperationResult<object>>;
