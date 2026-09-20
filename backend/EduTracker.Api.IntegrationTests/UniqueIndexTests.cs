using System.Net;

namespace EduTracker.Api.IntegrationTests;

// The unique indexes are business logic that lives in the schema. These
// tests insert the duplicate and assert the conflict response — the proof
// that the schema, not just the handler, enforces it. (An EF Core
// in-memory provider would enforce none of this, which is why these run
// against real Postgres.)
public sealed class UniqueIndexTests(EduTrackerAppFactory factory) : ApiTestBase(factory)
{
    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        string email = UniqueEmail();
        using HttpClient client = CreateClient();

        using HttpResponseMessage first = await RegisterAsync(client, email, UniqueUserName());
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using HttpResponseMessage second = await RegisterAsync(client, email, UniqueUserName());
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateUserName_Returns409()
    {
        string userName = UniqueUserName();
        using HttpClient client = CreateClient();

        using HttpResponseMessage first = await RegisterAsync(client, UniqueEmail(), userName);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using HttpResponseMessage second = await RegisterAsync(client, UniqueEmail(), userName);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_DoesNotCreateSecondUser()
    {
        // The conflict must leave exactly one row: login with the original
        // credentials still works afterwards.
        string email = UniqueEmail();
        using HttpClient client = CreateClient();

        using HttpResponseMessage first = await RegisterAsync(client, email, UniqueUserName());
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using HttpResponseMessage second = await RegisterAsync(client, email, UniqueUserName());
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);

        using HttpResponseMessage login = await LoginAsync(client, email);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }
}
