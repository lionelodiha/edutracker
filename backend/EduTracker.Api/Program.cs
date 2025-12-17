using EduTracker.Application;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Auth.Register;
using EduTracker.Application.Features.Test;
using EduTracker.Infrastructure;
using EduTracker.Infrastructure.CQRS.Messaging;
using EduTracker.Persistence;
using EduTracker.Persistence.Context;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddCqrs(typeof(RegisterUserCommand).Assembly);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapPost("/auth/register1", async (RegisterUserCommand command, IHandler<RegisterUserCommand, Guid> handler, AppDbContext db, CancellationToken ct) =>
{
    Guid userId = await handler.Handle(command, ct);
    string locationUri = $"/users/{userId}";
    return Results.Created(locationUri, new { Id = userId });
});

app.MapPost("/auth/register2", async (RegisterUserCommand command, IMediator mediator, AppDbContext db, CancellationToken ct) =>
{
    var userId = await mediator.Send(command, ct);
    string locationUri = $"/users/{userId}";
    return Results.Created(locationUri, new { Id = userId });
});

// app.MapPost("/tasks", async (CreateTaskCommand command, IMediator mediator, CancellationToken ct) =>
// {
//     var id = await mediator.Send<CreateTaskCommand, Guid>(command, ct);
//     return Results.Created($"/tasks/{id}", new { Id = id });
// });

app.MapGet("/test/helloworld", async (IMediator mediator, CancellationToken ct) =>
{
    string result = await mediator.Send(new HelloWorldCommand(), ct);
    return Results.Ok(result);
});

app.MapPost("/test/add", async (
    AddItemCommand command,
    IMediator mediator,
    CancellationToken ct) =>
{
    await mediator.Send(command, ct);
    return Results.Ok(FakeStore.Items);
});

app.MapGet("/test/items", async (
    IMediator mediator,
    CancellationToken ct) =>
{
    var items = await mediator.Send(new GetItemsQuery(), ct);
    return Results.Ok(items);
});

app.MapPost("/test/remove", async (
    RemoveItemCommand command,
    IMediator mediator,
    CancellationToken ct) =>
{
    await mediator.Send(command, ct);
    return Results.Ok(FakeStore.Items);
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
