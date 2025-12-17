using System.Text.Json;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Auth.Register;

public class RegisterUserCommandHandler(
    AppDbContext db,
    IValidator<RegisterUserCommand> validator,
    IHashingService hashingService,
    IDataEncryptionService dataEncryptionService) : IHandler<RegisterUserCommand, Guid>
{
    private readonly AppDbContext _db = db;
    private readonly IValidator<RegisterUserCommand> _validator = validator;
    private readonly IHashingService _hashingService = hashingService;
    private readonly IDataEncryptionService _dataEncryptionService = dataEncryptionService;

    public async Task<Guid> Handle(RegisterUserCommand command, CancellationToken ct)
    {
        // 1. Validate
        var validationResult = await _validator.ValidateAsync(command, ct);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        // 2. Normalize & hash email
        string normalizedEmail = command.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        // 3. Check username uniqueness
        if (await _db.Users.AnyAsync(u => u.UserName == command.UserName, ct))
            throw ResponseCatalog.User.UsernameAlreadyTaken.ToException();

        // 4. Check email uniqueness
        if (await _db.Users.AnyAsync(u => u.EmailHash == emailHash, ct))
            throw ResponseCatalog.User.EmailAlreadyTaken.ToException();

        // 5. Hash password & create entity
        string passwordHash = _hashingService.HashPassword(command.Password);

        // 5.1 User Factory
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

        user.SetSensitiveData(sensitiveData);
        user.SetEncryptedData(encryptedData);

        // 6. Persist
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return user.Id;
    }
}
