using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Semesters.CreateSemester;

public sealed record CreateSemesterCommand(
    Guid? ActorId,
    Guid OrganizationId,
    int StartYear
) : IMessage<OperationResult<Guid>>;
