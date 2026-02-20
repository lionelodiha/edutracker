using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.PromoteUser;

public sealed record PromoteUserCommand(
    Guid? ActorId,
    Guid TargetId
) : IMessage<OperationResult<object>>;
