using System.Text.Json;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Auth.Register;

public class RegisterUserCommandHandler(AppDbContext db, IHashingService hashingService, IDataEncryptionService dataEncryptionService)
    : IHandler<RegisterUserCommand, Guid>
{
    private readonly AppDbContext _db = db;
    private readonly IHashingService _hashingService = hashingService;
    private readonly IDataEncryptionService _dataEncryptionService = dataEncryptionService;

    public async Task<Guid> Handle(RegisterUserCommand command, CancellationToken ct)
    {
        string normalizedEmail = command.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        bool userNameExists = await _db.Users.AnyAsync(u => u.UserName == command.UserName.Trim(), ct);

        if (userNameExists)
            throw ResponseCatalog.User.UsernameAlreadyTaken.ToException();

        bool emailExists = await _db.Users.AnyAsync(u => u.EmailHash == emailHash, ct);

        if (emailExists)
            throw ResponseCatalog.User.EmailAlreadyTaken.ToException();

        string passwordHash = _hashingService.HashPassword(command.Password);
        User user = new(command.UserName.Trim(), emailHash, passwordHash);

        UserSensitive sensitiveData = new()
        {
            FirstName = command.FirstName.Trim(),
            MiddleName = command.MiddleName.Trim(),
            LastName = command.LastName.Trim(),
            Email = normalizedEmail
        };

        byte[] dataBlob = JsonSerializer.SerializeToUtf8Bytes(sensitiveData);
        byte[] encryptedData = _dataEncryptionService.EncryptData(dataBlob);

        user.SetEncryptedData(encryptedData);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return user.Id;
    }
}
