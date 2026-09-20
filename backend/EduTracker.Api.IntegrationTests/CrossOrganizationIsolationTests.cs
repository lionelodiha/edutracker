using System.Net;
using System.Net.Http.Json;

namespace EduTracker.Api.IntegrationTests;

// Actor in org A, resource id from org B: expect 403 or 404 and never 200.
public sealed class CrossOrganizationIsolationTests(EduTrackerAppFactory factory) : ApiTestBase(factory)
{
    private async Task<string> CreateOrganizationAsNewUserAsync()
    {
        string sessionId = await RegisterAndLoginAsync(Factory);
        using HttpClient authed = AuthenticatedClient(Factory, sessionId);

        using HttpResponseMessage created = await authed.PostAsJsonAsync(
            "/api/organizations", new { name = UniqueOrgName() });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        return CreatedId(created);
    }

    [Fact]
    public async Task GetOrganization_ByNonMember_Returns403()
    {
        string orgId = await CreateOrganizationAsNewUserAsync();

        string strangerSession = await RegisterAndLoginAsync(Factory);
        using HttpClient stranger = AuthenticatedClient(Factory, strangerSession);

        using HttpResponseMessage response = await stranger.GetAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetOrganization_ByOwner_Succeeds()
    {
        // Sanity counterpart: the same resource IS visible to its own org,
        // so the 403 above proves isolation rather than a broken route.
        string ownerSession = await RegisterAndLoginAsync(Factory);
        using HttpClient owner = AuthenticatedClient(Factory, ownerSession);

        using HttpResponseMessage created = await owner.PostAsJsonAsync(
            "/api/organizations", new { name = UniqueOrgName() });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        string orgId = CreatedId(created);

        using HttpResponseMessage response = await owner.GetAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetOrganization_UnknownId_Returns403()
    {
        // Membership is checked before existence, so an unknown id is
        // indistinguishable from a forbidden one: no existence oracle.
        string sessionId = await RegisterAndLoginAsync(Factory);
        using HttpClient authed = AuthenticatedClient(Factory, sessionId);

        using HttpResponseMessage response = await authed.GetAsync($"/api/organizations/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
