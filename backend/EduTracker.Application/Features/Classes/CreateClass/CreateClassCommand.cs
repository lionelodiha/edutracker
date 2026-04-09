using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.CreateClass;

public sealed record CreateClassCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string Name,
    string Code
) : IMessage<OperationResult<Guid>>;
