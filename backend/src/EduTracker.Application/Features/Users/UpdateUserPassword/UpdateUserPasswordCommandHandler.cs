using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Users.UpdateUserPassword;

internal sealed class UpdateUserPasswordCommandHandler(
    AppDbContext db,
    IHashingService hashingService,
    ICacheService cacheService
) : IHandler<UpdateUserPasswordCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateUserPasswordCommand message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        User user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == message.UserId.Value, cancellationToken)
            ?? throw ResponseCatalog.User.NotFound.ToException();

        bool isPasswordValid = await hashingService.VerifyPasswordAsync(message.CurrentPassword, user.PasswordHash);

        if (!isPasswordValid)
            throw ResponseCatalog.Auth.InvalidCurrentPassword.ToException();

        string newPasswordHash = await hashingService.HashPasswordAsync(message.NewPassword);
        user.SetPasswordHash(newPasswordHash);

        await db.SaveChangesAsync(cancellationToken);

        List<UserSession> sessions = await db.UserSessions
            .Where(s => s.UserId == user.Id && !s.IsRevoked)
            .ToListAsync(cancellationToken);

        if (sessions.Count > 0)
        {
            foreach (UserSession session in sessions)
            {
                if (!message.LogoutAll && message.SessionId.HasValue && session.Id == message.SessionId.Value)
                    continue;

                session.Revoke();
            }

            await db.SaveChangesAsync(cancellationToken);

            foreach (UserSession session in sessions)
            {
                if (!message.LogoutAll && message.SessionId.HasValue && session.Id == message.SessionId.Value)
                    continue;

                await cacheService.RemoveAsync(CacheKeys.SessionById(session.Id));
            }
        }

        return ResponseCatalog.User.PasswordUpdated.ToOperationResult();
    }
}
