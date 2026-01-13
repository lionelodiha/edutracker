using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using EduTracker.Domain.Entities.UserSessions;
using EduTracker.Application.Features.Auth.Models;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Features.Auth.Extensions;

namespace EduTracker.Application.Features.Auth.LoginUser;

public class LoginUserHandler(AppDbContext db, IHashingService hashingService, SessionManagementService sessionService)
    : IHandler<LoginUserRequest, OperationResult<SessionResult>>
{
    public async Task<OperationResult<SessionResult>> Handle(LoginUserRequest message, CancellationToken cancellationToken = default)
    {
        string emailHash = hashingService.HashEmail(message.Identifier);

        var userDto = await db.Users
            .AsNoTracking()
            .Where(u => u.EmailHash == emailHash || u.UserName == message.Identifier)
            .Select(u => new
            {
                u.Id,
                u.PasswordHash,
                u.IsLocked,
                u.Role,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        if (userDto.IsLocked)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        bool isPasswordValid = await hashingService.VerifyPasswordAsync(message.Password, userDto.PasswordHash);

        if (!isPasswordValid)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        UserSession sessionData = await sessionService.CreateSessionAsync(userDto.Id, userDto.Role, message.RememberMe, cancellationToken);

        SessionTimestampsResponse timeStamps = sessionData.ToTimestampsResponse();
        SessionResult data = new(sessionData.Id, timeStamps);

        return ResponseCatalog.Auth.LoginSuccessful
            .As<SessionResult>()
            .WithData(data)
            .ToOperationResult();
    }
}
