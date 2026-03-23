using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api.Authentication;
using EduTracker.Api.Constants.Auth;
using EduTracker.Api.Endpoints.Auth;
using EduTracker.Api.Endpoints.Base;
using EduTracker.Api.Endpoints.CourseOfferings;
using EduTracker.Api.Endpoints.Courses;
using EduTracker.Api.Endpoints.OrganizationInvites;
using EduTracker.Api.Endpoints.OrganizationMembers;
using EduTracker.Api.Endpoints.Organizations;
using EduTracker.Api.Endpoints.Semesters;
using EduTracker.Api.Endpoints.Sessions;
using EduTracker.Api.Endpoints.Terms;
using EduTracker.Api.Endpoints.Users;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Cors;
using EduTracker.Api.Extensions.OpenApi;
using EduTracker.Api.Hosting;
using EduTracker.Api.Middleware;
using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Json;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCustomCors(builder.Configuration);

builder.Services.AddPersistenceServices(builder.Configuration.GetConnectionString("Database"));
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices([typeof(IMediator).Assembly]);

builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication(AuthenticationSchemes.Session)
    .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(
        AuthenticationSchemes.Session,
        options => { options.ClaimsIssuer = "EduTracker"; }
    );

builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AuthenticationResultHandler>();

builder.Services.AddAuthorizationBuilder().AddCustomPolicies();

builder.Services.Configure<JsonOptions>(opts =>
{
    JsonSerializerOptions serializer = opts.SerializerOptions;

    serializer.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    serializer.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    serializer.WriteIndented = true;
    serializer.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddOpenApi(options => { options.AddCustomOpenApiTransformer(); });

builder.Services.AddHostedService<StartupTasksHostedService>();

WebApplication app = builder.Build();

app.UseCustomCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.Title = "EduTracker API";
        options.DefaultHttpClient = new(ScalarTarget.Node, ScalarClient.Fetch);
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapBaseEndpoints();
app.MapAuthEndpoints();
app.MapSessionEndpoints();
app.MapUserEndpoints();
app.MapOrganizationEndpoints();
app.MapOrganizationMemberEndpoints();
app.MapOrganizationInviteEndpoints();
app.MapCourseEndpoints();
app.MapSemesterEndpoints();
app.MapTermEndpoints();
app.MapCourseOfferingEndpoints();

app.Run();
