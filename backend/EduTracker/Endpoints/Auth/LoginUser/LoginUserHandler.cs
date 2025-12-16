using EduTracker.Constants.Responses;
using EduTracker.Extensions.Responses;
using EduTracker.Extensions.Validations;
using EduTracker.Models;
using EduTracker.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Endpoints.Auth.LoginUser;

public static class LoginUserHandler
{
    public static async Task<IResult> Handle(
        [FromBody] LoginUserRequest request,
        IValidator<LoginUserRequest> validator,
        IHashingService hashingService, CookieService cookieService,
        AppDbContext db, HttpContext httpContext,
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

        TimeSpan sessionDuration = request.RememberMe
            ? TimeSpan.FromDays(30)
            : TimeSpan.FromHours(8);

        var session = new UserSession(
            userId: user.Id,
            sessionDuration: sessionDuration,
            deviceType: InferDeviceType(httpContext) // or infer from headers later
        );


        db.UserSessions.Add(session);
        await db.SaveChangesAsync(ct);

        cookieService.SetCookie(
            key: "et:session",
            value: session.Id.ToString(),
            expires: sessionDuration,  // this makes the cookie last as long as session
            httpOnly: true,
            secure: true
        );

        ApiResponse<object> response = ResponseCatalog.Auth.LoginSuccessful
            .WithData(new { user.Id, user.UserName, user.PasswordHash, user.CreatedAt })
            .ToOperationResult<object>()
            .ToApiResponse();

        return Results.Ok(response);
    }

    private static DeviceType InferDeviceType(HttpContext context)
    {
        var ua = context.Request.Headers.UserAgent.ToString().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(ua))
            return DeviceType.Unknown;

        if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone"))
            return DeviceType.Mobile;

        if (ua.Contains("ipad") || ua.Contains("tablet"))
            return DeviceType.Tablet;

        return DeviceType.Web; // default desktop/browser
    }
}
