using EduTracker.Constants.Routes;
using EduTracker.Endpoints.Auth.LoginUser;
using EduTracker.Endpoints.Auth.RegisterUser;

namespace EduTracker.Endpoints.Auth;

public static class AuthEndpoints
{
    extension(IEndpointRouteBuilder routes)
    {
        public IEndpointRouteBuilder MapAuthEndpoints()
        {
            RouteGroupBuilder group = routes
                .MapGroup(ApiRoutes.Auth.Base)
                .WithTags("Auth");

            group.MapPost(ApiRoutes.Auth.Register, RegisterUserHandler.Handle);
            group.MapPost(ApiRoutes.Auth.Login, LoginUserHandler.Handle);

            return routes;
        }
    }
}


// Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ISessionService _sessions;
    private readonly ICookieService _cookies;

    public AuthController(ISessionService sessions, ICookieService cookies)
    {
        _sessions = sessions;
        _cookies = cookies;
    }

    // Example login: you would validate credentials separately
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        // TODO: validate user credentials and load userId and roles from your Users store
        // For demo, assume user authenticated:
        var userId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var roles = new[] { "User" };

        var session = await _sessions.CreateAsync(userId, roles, lifetime: TimeSpan.FromHours(8));

        _cookies.SetCookie(Response, "sid", session.SessionId.ToString(), expiresUtc: session.ExpiresUtc, httpOnly: true, secure: true);

        return Ok(new { sessionId = session.SessionId, userId = session.UserId, roles = session.Roles, expiresUtc = session.ExpiresUtc });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var sid = Request.Cookies.TryGetValue("sid", out var v) ? v : null;
        if (Guid.TryParse(sid, out var sessionId))
        {
            await _sessions.RevokeAsync(sessionId);
        }

        _cookies.DeleteCookie(Response, "sid");
        return Ok();
    }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}

// Controllers/AccountController.cs
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    // Require any valid session
    [HttpGet("me")]
    [RequireSession]
    public IActionResult Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var roles = string.Join(",", User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value));
        return Ok(new { userId, roles });
    }

    // Require Admin role
    [HttpGet("admin-area")]
    [RequireSession("Admin")]
    public IActionResult AdminArea()
    {
        return Ok(new { message = "Welcome, Admin." });
    }
}
