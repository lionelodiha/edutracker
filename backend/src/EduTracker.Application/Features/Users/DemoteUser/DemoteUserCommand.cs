using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.DemoteUser;

public sealed record DemoteUserCommand(
    Guid? ActorId,
    Guid TargetId
) : IMessage<OperationResult<object>>;
