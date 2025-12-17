using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Register;
using EduTracker.Infrastructure;
using EduTracker.Persistence;
using EduTracker.Persistence.Context;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration, typeof(RegisterUserCommand).Assembly);

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.MapPost("/auth/register", async (RegisterUserCommand command, IMediator mediator, AppDbContext db, CancellationToken ct) =>
{
    var userId = await mediator.Send(command, ct);
    string locationUri = $"/users/{userId}";
    return Results.Created(locationUri, new { Id = userId });
});

app.Run();
