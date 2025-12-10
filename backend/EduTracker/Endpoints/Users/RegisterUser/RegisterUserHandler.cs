using EduTracker.Constants.Responses;
using EduTracker.Constants.Routes;
using EduTracker.Data;
using EduTracker.Entities;
using EduTracker.Extensions.Entities;
using EduTracker.Extensions.Responses;
using EduTracker.Extensions.Validations;
using EduTracker.Interfaces.Services;
using EduTracker.Models;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Endpoints.Users.RegisterUser;

public static class RegisterUserHandler
{
    public static async Task<IResult> Handle([FromBody] RegisterUserRequest request, IValidator<RegisterUserRequest> validator, IHashingService hashingService, IDataEncryptionService dataEncryptionService, AppDbContext db, CancellationToken ct)
    {
        List<ResponseDetail> errors = await validator.ValidateRequestAsync(request, ct);

        if (errors.Count > 0)
            throw ResponseCatalog.System.ValidationFailed
                .AppendDetails([.. errors])
                .ToException();

        string normalizedEmail = request.Email.Trim().ToLowerInvariant();
        string emailHash = hashingService.HashEmail(normalizedEmail);

        bool userNameExists = await db.Users
            .AnyAsync(u => u.UserName == request.UserName, ct);

        if (userNameExists)
            throw ResponseCatalog.User.UsernameAlreadyTaken.ToException();

        bool emailExists = await db.Users.AnyAsync(u => u.EmailHash == emailHash, ct);

        if (emailExists)
            throw ResponseCatalog.User.EmailAlreadyTaken.ToException();

        string passwordHash = hashingService.HashPassword(request.Password);

        User user = UserFactory.Create(
            request,
            normalizedEmail,
            emailHash,
            passwordHash,
            dataEncryptionService
        );

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        ApiResponse<UserResponse> response = ResponseCatalog.Auth.RegisterSuccessful
            .As<UserResponse>()
            .WithData(user.ToUserResponse())
            .ToOperationResult()
            .ToApiResponse();

        string locationUri = ApiRoutes.User.Base + "/" + user.Id;

        return Results.Created(locationUri, response);
    }
}
