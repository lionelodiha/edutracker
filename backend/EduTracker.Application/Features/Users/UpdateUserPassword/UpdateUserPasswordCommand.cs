using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Users.UpdateUserPassword;

public sealed record UpdateUserPasswordCommand(
    Guid? UserId,
    Guid? SessionId,
    string CurrentPassword,
    string NewPassword,
    bool LogoutAll = false
) : IMessage<OperationResult<object>>;
