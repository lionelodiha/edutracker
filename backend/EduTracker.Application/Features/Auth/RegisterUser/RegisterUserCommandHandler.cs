using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Auth.RegisterUser;

internal sealed class RegisterUserCommandHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IHashingService hashingService,
    IDataEncryptionService encryptionService
) : IHandler<RegisterUserCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(RegisterUserCommand message, CancellationToken cancellationToken = default)
    {
        string emailHash = hashingService.HashEmail(message.Email);
        string normalizedUserName = message.UserName.Trim();

        if (await db.Users.AnyAsync(u => u.EmailHash == emailHash, cancellationToken))
            throw ResponseCatalog.Auth.EmailAlreadyExists.ToException();

        if (await db.Users.AnyAsync(u => u.UserName == normalizedUserName, cancellationToken))
            throw ResponseCatalog.User.UserNameExists.ToException();

        UserSensitive sensitiveData = UserSensitive.Create(
            firstName: message.FirstName,
            middleName: message.MiddleName,
            lastName: message.LastName,
            email: message.Email
        );

        byte[] sensitiveDataBytes = ObjectByteConverter.SerializeToBytes(sensitiveData);
        byte[] encryptedData = encryptionService.Encrypt(sensitiveDataBytes, CryptoPurpose.UserSensitiveData);

        string passwordHash = await hashingService.HashPasswordAsync(message.Password);

        User user = new(
            userName: normalizedUserName,
            emailHash: emailHash,
            passwordHash: passwordHash
        );

        user.SetSensitiveData(sensitiveData);
        user.SetEncryptedData(encryptedData);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.SetAsync(
            CacheKeys.UserProfileById(user.Id),
            user.ToUserResponse(),
            cacheTtlOptions.Value.UserProfileByIdTtl
        );

        user.ClearSensitiveData();

        return ResponseCatalog.Auth.RegistrationSuccessful
            .As<Guid>()
            .WithData(user.Id)
            .ToOperationResult();
    }
}
