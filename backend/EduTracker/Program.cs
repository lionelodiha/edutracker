using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Endpoints.Users;
using EduTracker.Extensions;
using EduTracker.Interfaces.Services;
using EduTracker.Middleware;
using EduTracker.Services;
using FluentValidation;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.LoadApplicationConfiguration();

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    opts.SerializerOptions.WriteIndented = true;
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddSingleton<IHashingService, HashingService>();
builder.Services.AddSingleton<IDataEncryptionService, AesDataEncryptionService>();

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

// Register your exception handling middleware here
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapUserEndpoints();

app.Run();
