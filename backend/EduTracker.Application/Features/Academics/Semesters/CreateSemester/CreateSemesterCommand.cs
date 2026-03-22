using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Semesters.CreateSemester;

public sealed record CreateSemesterCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string Session
) : IMessage<OperationResult<Guid>>;
