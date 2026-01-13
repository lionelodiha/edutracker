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

namespace EduTracker.Application.Features.Auth.RegisterUser;

public class RegisterUserHandler(AppDbContext db, IHashingService hashingService, IDataEncryptionService encryptionService)
    : IHandler<RegisterUserRequest, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(RegisterUserRequest message, CancellationToken cancellationToken = default)
    {
        string emailHash = hashingService.HashEmail(message.Email);

        if (await db.Users.AnyAsync(u => u.EmailHash == emailHash, cancellationToken))
            throw ResponseCatalog.Auth.EmailAlreadyExists.ToException();

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
            userName: message.UserName.Trim(),
            emailHash: emailHash,
            passwordHash: passwordHash
        );

        user.SetEncryptedData(encryptedData);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Auth.RegistrationSuccessful
            .As<Guid>()
            .WithData(user.Id)
            .ToOperationResult();
    }
}
