using System.Text.Json;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Auth.Register;

public class RegisterUserCommandHandler(AppDbContext db, IHashingService hashingService, IDataEncryptionService dataEncryptionService)
    : IHandler<RegisterUserCommand, OperationResult<Guid>>
{
    private readonly AppDbContext _db = db;
    private readonly IHashingService _hashingService = hashingService;
    private readonly IDataEncryptionService _dataEncryptionService = dataEncryptionService;

    public async Task<OperationResult<Guid>> Handle(RegisterUserCommand message, CancellationToken cancellationToken)
    {
        string normalizedEmail = message.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        bool userNameExists = await _db.Users.AnyAsync(u => u.UserName == message.UserName.Trim(), cancellationToken);

        if (userNameExists)
            throw ResponseCatalog.User.UsernameAlreadyTaken.ToException();

        bool emailExists = await _db.Users.AnyAsync(u => u.EmailHash == emailHash, cancellationToken);

        if (emailExists)
            throw ResponseCatalog.User.EmailAlreadyTaken.ToException();

        string passwordHash = _hashingService.HashPassword(message.Password);
        User user = new(message.UserName.Trim(), emailHash, passwordHash);

        UserSensitive sensitiveData = new()
        {
            FirstName = message.FirstName.Trim(),
            MiddleName = message.MiddleName.Trim(),
            LastName = message.LastName.Trim(),
            Email = normalizedEmail,
        };

        byte[] dataBlob = JsonSerializer.SerializeToUtf8Bytes(sensitiveData);
        byte[] encryptedData = _dataEncryptionService.EncryptData(dataBlob);

        user.SetEncryptedData(encryptedData);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Auth.RegisterSuccessful
            .As<Guid>()
            .WithData(user.Id)
            .ToOperationResult();
    }
}
