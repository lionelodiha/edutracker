using System.Security.Claims;
using System.Text.Encodings.Web;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace EduTracker.Api.Authentication;

internal sealed class SessionAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    SessionStateService sessionService,
    UserAuthenticationStateService userAuthService
) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        Endpoint? endpoint = Context.GetEndpoint();

        if (endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() is not null)
            return AuthenticateResult.NoResult();

        if (!TryGetSessionIdFromCookie(out Guid sessionId))
            return AuthenticateResult.NoResult();

        SessionData? sessionData = await sessionService.GetSessionDataAsync(sessionId, Context.RequestAborted);

        if (sessionData is null || sessionData.IsExpired())
            return AuthenticateResult.Fail("Invalid or expired session");

        UserAuthData? authData = await userAuthService.GetUserAuthDataAsync(sessionData.UserId, Context.RequestAborted);

        if (authData is null || authData.IsLocked)
            return AuthenticateResult.Fail("User account is locked or not found");

        List<Claim> claims = [
            new Claim(ClaimTypes.NameIdentifier, authData.UserId.ToString()),
            new Claim(ClaimTypes.Role, authData.Role.ToString()),
            new Claim(SessionClaimTypes.SessionId, sessionData.SessionId.ToString())
        ];

        ClaimsIdentity identity = new(claims, Scheme.Name);
        ClaimsPrincipal principal = new(identity);
        AuthenticationTicket ticket = new(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }

    private bool TryGetSessionIdFromCookie(out Guid sessionId)
    {
        string? rawSessionId = CookieHelper.GetCookie(Context.Request, CookieKeys.Session);
        return Guid.TryParse(rawSessionId, out sessionId);
    }
}
