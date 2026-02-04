using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.UserSessions;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Auth.LogoutUser;

public sealed class LogoutUserCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<LogoutUserCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(LogoutUserCommand message, CancellationToken cancellationToken = default)
    {
        if (message.SessionId.HasValue)
        {
            UserSession? activeSession = await db.UserSessions
                .FirstOrDefaultAsync(s => s.Id == message.SessionId && !s.IsRevoked, cancellationToken);

            activeSession?.Revoke();

            await cacheService.RemoveAsync(CacheKeys.SessionById(message.SessionId.Value));
        }

        return ResponseCatalog.Auth.LogoutSuccessful.ToOperationResult();
    }
}
