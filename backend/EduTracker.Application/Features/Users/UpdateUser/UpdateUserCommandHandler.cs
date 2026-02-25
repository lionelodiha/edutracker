using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Users.UpdateUser;

internal sealed class UpdateUserCommandHandler(
    AppDbContext db,
    ICacheService cacheService,
    IDataEncryptionService encryptionService
) : IHandler<UpdateUserCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateUserCommand message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        User user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == message.UserId.Value, cancellationToken)
            ?? throw ResponseCatalog.User.NotFound.ToException();

        UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
            encryptionService.Decrypt(user.EncryptedData, CryptoPurpose.UserSensitiveData)
        );

        user.SetSensitiveData(sensitiveData);

        if (!string.IsNullOrWhiteSpace(message.UserName) && message.UserName != user.UserName)
        {
            bool userNameExists = await db.Users
                .AnyAsync(u => u.UserName == message.UserName.Trim(), cancellationToken);

            if (userNameExists)
                throw ResponseCatalog.User.UserNameExists.ToException();

            user.SetUserName(message.UserName.Trim());
        }

        if (message.FirstName is not null || message.MiddleName is not null || message.LastName is not null)
        {
            string firstName = message.FirstName ?? sensitiveData.FirstName;
            string lastName = message.LastName ?? sensitiveData.LastName;
            string? middle = message.MiddleName ?? sensitiveData.MiddleName;

            sensitiveData.UpdateName(firstName, middle, lastName);
        }

        byte[] sensitiveBytes = ObjectByteConverter.SerializeToBytes(sensitiveData);
        byte[] encryptedData = encryptionService.Encrypt(
            sensitiveBytes,
            CryptoPurpose.UserSensitiveData
        );

        user.SetEncryptedData(encryptedData);

        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.UserProfileById(user.Id));

        user.ClearSensitiveData();

        return ResponseCatalog.User.Updated.ToOperationResult();
    }
}
