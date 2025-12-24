using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Services;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Login;
using EduTracker.Application.Features.Auth.Register;
using EduTracker.Application.Features.Auth.Revoke;
using EduTracker.Application.Models;
using EduTracker.Application.Services;

namespace EduTracker.Api.Endpoints;

public static class AuthEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public RouteGroupBuilder MapAuthEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Auth.Base)
                .WithTags("Authentication");

            group.MapPost(ApiRoutes.Auth.Register, Register)
                .WithSummary("Create a user account");

            group.MapPost(ApiRoutes.Auth.Login, Login)
                .WithSummary("Login with a user account");

            return group;
        }
    }

    private static async Task<IResult> Register(RegisterUserCommand command, IMediator mediator, CancellationToken ct)
    {
        OperationResult<Guid> response = await mediator.Send(command, ct);

        string locationUri = $"{ApiRoutes.User.Base}/{response.Data}";
        return Results.Created(locationUri, response.WithoutData().ToApiResponse());
    }

    private static async Task<IResult> Login(LoginUserCommand command, IMediator mediator, HttpRequest httpRequest, HttpResponse httpResponse, CookieService cookieService, JwtService jwtService, CancellationToken ct)
    {
        string? existingSession = cookieService.GetCookie(httpRequest, CookieKeys.Session);

        if (!string.IsNullOrWhiteSpace(existingSession) && Guid.TryParseExact(existingSession, "N", out Guid existingSessionId))
            await mediator.Send(new RevokeUserCommand(existingSessionId), ct);

        OperationResult<SessionData> loginResult = await mediator.Send(command, ct);

        if (loginResult.Data is null) return Results.Unauthorized();

        SessionData session = loginResult.Data;

        string accessToken = jwtService.GenerateToken(
        [
            new Claim(JwtRegisteredClaimNames.Sub, session.UserId.ToString()),
            new Claim("sid", session.SessionId.ToString()),
            new Claim(ClaimTypes.Role, session.Role.ToString())
        ]);

        cookieService.SetCookie(
            httpResponse,
            CookieKeys.Session,
            session.SessionId.ToString("N"),
            session.ExpiresAt
        );

        cookieService.SetCookie(
            httpResponse,
            CookieKeys.AccessToken,
            accessToken,
            DateTime.UtcNow.AddMinutes(15)
        );

        return Results.Ok(loginResult.WithoutData().ToApiResponse());
    }
}
