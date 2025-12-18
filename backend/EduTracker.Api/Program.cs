using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Middleware;
using EduTracker.Api.Services;
using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Login;
using EduTracker.Application.Features.Auth.Register;
using EduTracker.Application.Models;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using Microsoft.AspNetCore.Http.Json;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.Configure<JsonOptions>(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    opts.SerializerOptions.WriteIndented = true;
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration, [typeof(IHandler<,>).Assembly]);

builder.Services.AddScoped<CookieService>();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseMiddleware<TraceIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.MapPost("/auth/register", async (RegisterUserCommand command, IMediator mediator, CancellationToken ct) =>
{
    OperationResult<Guid> response = await mediator.Send(command, ct);

    string locationUri = $"/users/{response.Data}";
    return Results.Created(locationUri, response.WithoutData().ToApiResponse());
});

app.MapPost("/auth/login", async (LoginUserCommand command, IMediator mediator, HttpResponse httpResponse, CookieService cookieService, CancellationToken ct) =>
{
    OperationResult<SessionData> response = await mediator.Send(command, ct);
    cookieService.SetCookie(httpResponse, CookieKeys.Session, response.Data!.SessionId.ToString("N"));

    return Results.Ok(response.WithoutData().ToApiResponse());
});

app.Run();
