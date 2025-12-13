using EduTracker.Constants.Responses;
using EduTracker.Data;
using EduTracker.Endpoints.Users;
using EduTracker.Entities;
using EduTracker.Extensions.Entities;
using EduTracker.Extensions.Responses;
using EduTracker.Extensions.Validations;
using EduTracker.Interfaces.Services;
using EduTracker.Models;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Endpoints.Auth.LoginUser;

public static class LoginUserHandler
{
    public static async Task<IResult> Handle(
        [FromBody] LoginUserRequest request,
        IValidator<LoginUserRequest> validator,
        IHashingService hashingService,
        AppDbContext db,
        CancellationToken ct)
    {
        List<ResponseDetail> errors = await validator.ValidateRequestAsync(request, ct);

        if (errors.Count > 0)
            throw ResponseCatalog.System.ValidationFailed
                .AppendDetails([.. errors])
                .ToException();

        string identifier = request.Identifier.Trim();
        bool isEmail = identifier.Contains('@');

        User? user;

        if (isEmail)
        {
            string normalizedEmail = identifier.ToLowerInvariant();
            string emailHash = hashingService.HashEmail(normalizedEmail);

            user = await db.Users
                .SingleOrDefaultAsync(u => u.EmailHash == emailHash, ct);
        }
        else
        {
            user = await db.Users
                .SingleOrDefaultAsync(u => u.UserName == identifier, ct);
        }

        if (user is null)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        bool passwordValid = hashingService.VerifyPassword(
            request.Password,
            user.PasswordHash
        );

        if (!passwordValid)
            throw ResponseCatalog.Auth.InvalidCredentials.ToException();

        // TODO:
        // - generate access token
        // - generate refresh token (longer if RememberMe)
        // - persist refresh token hash

        ApiResponse<object> response = ResponseCatalog.Auth.LoginSuccessful
            .WithData(new { user.Id, user.UserName, user.PasswordHash, user.CreatedAt })
            .ToOperationResult<object>()
            .ToApiResponse();

        return Results.Ok(response);
    }
}
