using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EduTracker.Application.Features.Auth.RegisterUser;

namespace EduTracker.Api.IntegrationTests;

[Collection(ApiTestCollection.Name)]
public abstract class ApiTestBase(EduTrackerAppFactory factory)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    protected EduTrackerAppFactory Factory { get; } = factory;

    protected HttpClient CreateClient() => Factory.CreateClient();

    protected static string UniqueEmail() => $"user-{Guid.NewGuid():N}@example.com";

    protected static string UniqueUserName() => $"user_{Guid.NewGuid():N}"[..30];

    protected static string UniqueOrgName() => $"School {Guid.NewGuid():N}"[..27];

    protected const string ValidPassword = "Str0ng!Pass4";

    protected static async Task<HttpResponseMessage> RegisterAsync(
        HttpClient client, string email, string userName, string password = ValidPassword)
    {
        var command = new RegisterUserCommand(
            FirstName: "Test",
            MiddleName: null,
            LastName: "User",
            UserName: userName,
            Email: email,
            Password: password);

        return await client.PostAsJsonAsync("/api/auth/register", command);
    }

    protected static async Task<HttpResponseMessage> LoginAsync(
        HttpClient client, string identifier, string password = ValidPassword)
    {
        return await client.PostAsJsonAsync(
            "/api/auth/login", new { identifier, password, rememberMe = false });
    }

    protected static string GetSessionCookie(HttpResponseMessage loginResponse)
    {
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        string? setCookie = loginResponse.Headers
            .GetValues("Set-Cookie")
            .FirstOrDefault(v => v.StartsWith("edu_session_id=", StringComparison.Ordinal));

        Assert.False(string.IsNullOrEmpty(setCookie));

        // "edu_session_id=<N-guid>; path=/; ..." -> "<N-guid>"
        return setCookie!.Split(';')[0].Split('=')[1];
    }

    protected static HttpClient AuthenticatedClient(EduTrackerAppFactory factory, string sessionId)
    {
        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"edu_session_id={sessionId}");
        return client;
    }

    protected static async Task<string> RegisterAndLoginAsync(
        EduTrackerAppFactory factory, string? email = null, string? userName = null)
    {
        email ??= UniqueEmail();
        userName ??= UniqueUserName();

        using HttpClient client = factory.CreateClient();

        HttpResponseMessage register = await RegisterAsync(client, email, userName);
        Assert.Equal(HttpStatusCode.Created, register.StatusCode);

        using HttpResponseMessage login = await LoginAsync(client, email);
        return GetSessionCookie(login);
    }

    protected static string CreatedId(HttpResponseMessage response)
    {
        // Results.Created emits a relative Location ("/api/organizations/{id}"),
        // whose Segments property throws. The id is the last path segment.
        Assert.NotNull(response.Headers.Location);
        return response.Headers.Location.OriginalString.Split('/')[^1];
    }

    protected static async Task<T?> ReadDataAsync<T>(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<T>>(Json);
        Assert.NotNull(body);
        return body.Data;
    }

    protected sealed record ApiResponse<T>(
        bool Success, string MessageId, string Message, object? Details, T? Data);
}
