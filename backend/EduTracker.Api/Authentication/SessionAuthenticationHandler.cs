using System.Security.Claims;
using System.Text.Encodings.Web;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace EduTracker.Api.Authentication;

internal class SessionAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder, SessionManagementService sessionService)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        Endpoint? endpoint = Context.GetEndpoint();

        if (endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() is not null)
            return AuthenticateResult.NoResult();

        if (!TryGetSessionIdFromCookie(out Guid sessionId))
            return AuthenticateResult.NoResult();

        SessionData? sessionData = await sessionService.GetSessionDataAsync(sessionId, Context.RequestAborted);

        if (sessionData is null || sessionData.IsLocked || sessionData.IsExpired())
            return AuthenticateResult.Fail("Invalid or expired session");

        IEnumerable<Claim> claims = sessionData.ToClaims();

        ClaimsIdentity identity = new(claims, Scheme.Name);
        ClaimsPrincipal principal = new(identity);
        AuthenticationTicket ticket = new(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }

    private bool TryGetSessionIdFromCookie(out Guid sessionId)
    {
        sessionId = Guid.Empty;

        if (!Request.Cookies.TryGetValue(CookieKeys.Session, out string? rawSessionId))
            return false;

        return Guid.TryParse(rawSessionId, out sessionId);
    }
}
