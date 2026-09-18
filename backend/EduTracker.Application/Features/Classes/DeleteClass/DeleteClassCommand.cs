using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.DeleteClass;

public sealed record DeleteClassCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid ClassId
) : IMessage<OperationResult<object>>;
