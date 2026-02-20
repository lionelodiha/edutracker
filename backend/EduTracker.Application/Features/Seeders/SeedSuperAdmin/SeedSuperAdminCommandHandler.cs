using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Seeders.SeedSuperAdmin;

public sealed class SeedSuperAdminCommandHandler(
    AppDbContext db,
    IHashingService hashingService,
    IDataEncryptionService encryptionService
) : IHandler<SeedSuperAdminCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(SeedSuperAdminCommand message, CancellationToken cancellationToken = default)
    {
        bool superAdminExists = await db.Users
            .AnyAsync(u => u.Role == SystemRole.SuperAdmin, cancellationToken);

        if (superAdminExists)
            return ResponseCatalog.System.SuperAdminSeeded.ToOperationResult();

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

        byte[] sensitiveBytes = ObjectByteConverter.SerializeToBytes(sensitiveData);
        byte[] encryptedData = encryptionService.Encrypt(sensitiveBytes, CryptoPurpose.UserSensitiveData);

        string passwordHash = await hashingService.HashPasswordAsync(message.Password);

        User superAdmin = new(
            userName: normalizedUserName,
            emailHash: emailHash,
            passwordHash: passwordHash
        );

        superAdmin.SetEncryptedData(encryptedData);
        superAdmin.UpdateRole(SystemRole.SuperAdmin);

        db.Users.Add(superAdmin);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.System.SuperAdminSeeded.ToOperationResult();
    }
}
