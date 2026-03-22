using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Semesters.UpdateSemester;

public sealed record UpdateSemesterCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid SemesterId,
    string Session
) : IMessage<OperationResult<object>>;
