using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.UpdateClass;

public sealed record UpdateClassCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid ClassId,
    string Name,
    string Code
) : IMessage<OperationResult<object>>;
