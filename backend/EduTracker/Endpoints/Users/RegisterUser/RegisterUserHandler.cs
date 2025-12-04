using EduTracker.Constants.Responses;
using EduTracker.Data;
using EduTracker.Entities;
using EduTracker.Exceptions;
using EduTracker.Extensions;
using EduTracker.Extensions.Responses;
using EduTracker.Interfaces.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Endpoints.Users.RegisterUser;

public static class RegisterUserHandler
{
    public static async Task<IResult> Handle(
        [FromBody] RegisterUserRequest request,
        IValidator<RegisterUserRequest> validator,
        IHashingService hashingService,
        IDataEncryptionService dataEncryptionService,
        AppDbContext db,
        CancellationToken ct)
    {
        var (valid, errors) = await validator.ValidateDomainAsync(request, ct);

        if (!valid)
            throw new AppException(
                id: "VALIDATION_FAILED",
                statusCode: 400,
                title: "Validation error",
                details: errors?.ToArray()
            );

        // 2. Normalize inputs
        string normalizedUserName = request.UserName.Trim();
        string normalizedEmail = request.Email.Trim().ToLowerInvariant();
        string emailHash = hashingService.HashEmail(normalizedEmail);

        // 3. Check uniqueness
        bool userNameExists = await db.Users.AnyAsync(u => u.UserName == request.UserName, ct);

        if (userNameExists)
            return Results.Conflict(new { UserName = "This username is already taken." });

        bool emailExists = await db.Users.AnyAsync(u => u.EmailHash == emailHash, ct);

        if (emailExists)
            throw ResponseCatalog.Auth.EmailAlreadyTaken.ToException();

        // 4. Hash password once
        string passwordHash = hashingService.HashPassword(request.Password);

        // 5. Create user
        User user = UserFactory.Create(
            request,
            normalizedEmail,
            passwordHash,
            emailHash,
            dataEncryptionService
        );

        // 6. Save
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var response = new UserResponse(user.Id, request.FirstName, request.MiddleName, request.LastName, request.UserName, request.Email);

        var data = ResponseCatalog.Auth.RegisterSuccessful
            .As<UserResponse>()
            .WithData(response)
            .ToOperationResult()
            .ToApiResponse();

        // 7. Return response
        return Results.Created(
            $"/api/users/{user.Id}", data
        );
    }
}
