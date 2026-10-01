using Microsoft.Extensions.Configuration;

IDistributedApplicationBuilder builder = DistributedApplication.CreateBuilder(args);

IResourceBuilder<ParameterResource> databaseConnection = AddSensitiveConfig(
    "postgresql-connection",
    builder.Configuration.GetConnectionString("Database")
);

IResourceBuilder<ParameterResource> redisConnection = AddSensitiveConfig(
    "redis-connection",
    builder.Configuration.GetConnectionString("Redis")
);

IResourceBuilder<ParameterResource> keyVersion = AddPlainConfig(
    "current-key-version",
    builder.Configuration["DataEncryptionOptions:CurrentKeyVersion"]
);

IResourceBuilder<ParameterResource> encryptionKey = AddSensitiveConfig(
    "encryption-key-1",
    builder.Configuration["DataEncryptionOptions:Keys:1"]
);

IResourceBuilder<ParameterResource> emailHmacKey = AddSensitiveConfig(
    "email-hmac-key",
    builder.Configuration["HashingOptions:EmailHmacKey"]
);

IResourceBuilder<ProjectResource> api = builder.AddProject<Projects.EduTracker_Api>("api")
    .WithExternalHttpEndpoints()
    .WithEnvironment("ConnectionStrings__Database", databaseConnection)
    .WithEnvironment("ConnectionStrings__Redis", redisConnection)
    .WithEnvironment("DataEncryptionOptions__Keys__1", encryptionKey)
    .WithEnvironment("DataEncryptionOptions__CurrentKeyVersion", keyVersion)
    .WithEnvironment("HashingOptions__EmailHmacKey", emailHmacKey);

IResourceBuilder<ProjectResource> worker = builder.AddProject<Projects.EduTracker_Worker>("worker")
    .WithEnvironment("ConnectionStrings__Database", databaseConnection)
    .WithEnvironment("ConnectionStrings__Redis", redisConnection)
    .WithEnvironment("DataEncryptionOptions__Keys__1", encryptionKey)
    .WithEnvironment("DataEncryptionOptions__CurrentKeyVersion", keyVersion)
    .WithEnvironment("HashingOptions__EmailHmacKey", emailHmacKey);

builder.AddViteApp("web", "../../frontend/edu-tracker")
    .WithExternalHttpEndpoints()
    .WithEndpoint("http", ea => ea.Port = 4200, createIfNotExists: true)
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();

IResourceBuilder<ParameterResource> AddSensitiveConfig(string name, string? existing) =>
    string.IsNullOrEmpty(existing)
        ? builder.AddParameter(name, secret: true)
        : builder.AddParameter(name, existing, secret: true);

IResourceBuilder<ParameterResource> AddPlainConfig(string name, string? existing) =>
    string.IsNullOrEmpty(existing)
        ? builder.AddParameter(name)
        : builder.AddParameter(name, existing);
