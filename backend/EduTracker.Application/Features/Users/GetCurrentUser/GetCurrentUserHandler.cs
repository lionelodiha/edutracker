using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Users.GetCurrentUser;

public class GetCurrentUserHandler(AppDbContext db, IDataEncryptionService encryptionService)
    : IHandler<GetCurrentUserRequest, OperationResult<UserResponse>>
{
    public async Task<OperationResult<UserResponse>> Handle(GetCurrentUserRequest message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        User user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == message.UserId.Value, cancellationToken)
            ?? throw ResponseCatalog.Auth.InvalidSession.ToException();

        if (user.IsLocked)
            throw ResponseCatalog.Auth.AccountLocked.ToException();

        UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
            encryptionService.Decrypt(user.EncryptedData, CryptoPurpose.UserSensitiveData)
        );

        user.SetSensitiveData(sensitiveData);

        return ResponseCatalog.User.UserRetrieved
            .As<UserResponse>()
            .WithData(user.ToUserResponse())
            .ToOperationResult();
    }
}
