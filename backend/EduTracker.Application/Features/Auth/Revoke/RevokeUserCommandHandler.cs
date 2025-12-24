using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Services;

namespace EduTracker.Application.Features.Auth.Revoke;

public class RevokeUserCommandHandler(SessionManagementService sessionManagementService)
    : IHandler<RevokeUserCommand, bool>
{
    public async Task<bool> Handle(RevokeUserCommand message, CancellationToken cancellationToken = default)
    {
        bool isRevoked = await sessionManagementService.RevokeSessionAsync(message.SessionId, cancellationToken);
        return isRevoked;
    }
}
