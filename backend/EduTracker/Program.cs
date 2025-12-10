using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Endpoints.Users;
using EduTracker.Extensions.Configurations;
using EduTracker.Middleware;
using FluentValidation;
using Microsoft.AspNetCore.Http.Json;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.LoadApplicationConfiguration();

builder.Services.Configure<JsonOptions>(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    opts.SerializerOptions.WriteIndented = true;
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

builder.Services.AddOpenApi();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapUserEndpoints();

app.Run();
