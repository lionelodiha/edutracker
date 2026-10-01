using System.Net;
using System.Net.Http.Json;

namespace EduTracker.Api.IntegrationTests;

// Playbook order, first: auth. If this breaks, everything breaks.
public sealed class AuthTests(EduTrackerAppFactory factory) : ApiTestBase(factory)
{
    [Fact]
    public async Task Register_Login_Me_Succeeds()
    {
        string email = UniqueEmail();
        string userName = UniqueUserName();
        using HttpClient client = CreateClient();

        using HttpResponseMessage register = await RegisterAsync(client, email, userName);
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        Assert.NotNull(register.Headers.Location); // Location: /api/users/{id}

        using HttpResponseMessage login = await LoginAsync(client, email);
        string sessionId = GetSessionCookie(login); // session cookie issued

        using HttpClient authed = AuthenticatedClient(Factory, sessionId);
        using HttpResponseMessage me = await authed.GetAsync("/api/users/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode); // protected endpoint accepts it
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        string email = UniqueEmail();
        using HttpClient client = CreateClient();

        using HttpResponseMessage register = await RegisterAsync(client, email, UniqueUserName());
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        using HttpResponseMessage login = await LoginAsync(client, email, "Wr0ng!Pass9");
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task Me_WithoutSession_Returns401()
    {
        using HttpClient client = CreateClient();

        using HttpResponseMessage me = await client.GetAsync("/api/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesSession_SubsequentUseIsRejected()
    {
        string sessionId = await RegisterAndLoginAsync(Factory);
        using HttpClient authed = AuthenticatedClient(Factory, sessionId);

        using HttpResponseMessage logout = await authed.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);

        using HttpResponseMessage me = await authed.GetAsync("/api/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode); // revoked session rejected
    }

    [Fact]
    public async Task Login_ByUserName_Succeeds()
    {
        string email = UniqueEmail();
        string userName = UniqueUserName();
        using HttpClient client = CreateClient();

        using HttpResponseMessage register = await RegisterAsync(client, email, userName);
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        using HttpResponseMessage login = await LoginAsync(client, userName);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }
}
