using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Sessions.GetCurrentUserSessions;

public sealed record GetCurrentUserSessionsQuery(
    Guid? UserId
) : IMessage<OperationResult<IReadOnlyList<SessionData>>>;
