using System.Net;
using System.Net.Http.Json;

namespace EduTracker.Api.IntegrationTests;

// One role check per role. This is the class of bug that becomes a data breach.
public sealed class AuthorizationTests(EduTrackerAppFactory factory) : ApiTestBase(factory)
{
    [Fact]
    public async Task ListUsers_AsPlainUser_Returns403()
    {
        // GET /api/users requires the AdminOnly policy; a freshly registered
        // user has the User role.
        string sessionId = await RegisterAndLoginAsync(Factory);
        using HttpClient authed = AuthenticatedClient(Factory, sessionId);

        using HttpResponseMessage response = await authed.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PromoteUser_AsPlainUser_Returns403()
    {
        // POST /api/users/{id}/promote requires SuperAdminOnly.
        string sessionId = await RegisterAndLoginAsync(Factory);
        using HttpClient authed = AuthenticatedClient(Factory, sessionId);

        using HttpResponseMessage response =
            await authed.PostAsync($"/api/users/{Guid.NewGuid()}/promote", content: null);
        // 403 from the policy gate, before any handler logic runs.
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOrganization_AsNonOwner_Returns403()
    {
        // Only the owner can delete. The actor here is not even a member.
        string ownerSession = await RegisterAndLoginAsync(Factory);
        using HttpClient owner = AuthenticatedClient(Factory, ownerSession);

        using HttpResponseMessage created = await owner.PostAsJsonAsync(
            "/api/organizations", new { name = UniqueOrgName() });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        string orgId = CreatedId(created);

        string strangerSession = await RegisterAndLoginAsync(Factory);
        using HttpClient stranger = AuthenticatedClient(Factory, strangerSession);

        using HttpResponseMessage deleted = await stranger.DeleteAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.Forbidden, deleted.StatusCode);
    }

    [Fact]
    public async Task DeleteOrganization_AsOwner_Succeeds()
    {
        string sessionId = await RegisterAndLoginAsync(Factory);
        using HttpClient authed = AuthenticatedClient(Factory, sessionId);

        using HttpResponseMessage created = await authed.PostAsJsonAsync(
            "/api/organizations", new { name = UniqueOrgName() });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        string orgId = CreatedId(created);

        using HttpResponseMessage deleted = await authed.DeleteAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.OK, deleted.StatusCode);
    }
}
