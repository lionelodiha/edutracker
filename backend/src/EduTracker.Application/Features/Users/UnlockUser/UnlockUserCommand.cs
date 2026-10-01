using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.UnlockUser;

public sealed record UnlockUserCommand(
    Guid? ActorId,
    Guid TargetId
) : IMessage<OperationResult<object>>;
