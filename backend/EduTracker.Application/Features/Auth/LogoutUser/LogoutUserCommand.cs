using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Auth.LogoutUser;

public sealed record LogoutUserCommand(
    Guid? SessionId
) : IMessage<OperationResult<object>>;
