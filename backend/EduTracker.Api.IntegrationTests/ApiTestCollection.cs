namespace EduTracker.Api.IntegrationTests;

// One Postgres container and one migrated database shared by every
// integration test class. xUnit creates a single factory for the whole
// collection, so migrations run once and each test isolates itself with
// unique emails, usernames and organization names instead.
[CollectionDefinition(Name)]
public sealed class ApiTestCollection : ICollectionFixture<EduTrackerAppFactory>
{
    public const string Name = "api";
}
