using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.LockUser;

public sealed record LockUserCommand(
    Guid? ActorId,
    Guid TargetId
) : IMessage<OperationResult<object>>;
