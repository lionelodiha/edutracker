using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Endpoints.Auth;
using EduTracker.Endpoints.Users;
using EduTracker.Extensions.Configurations;
using EduTracker.Infrastructure.Services;
using EduTracker.Middleware;
using Microsoft.AspNetCore.Http.Json;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.LoadApplicationConfiguration();

builder.Services.Configure<JsonOptions>(opts =>
{
    opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    opts.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    opts.SerializerOptions.WriteIndented = true;
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);
builder.Services.AddScoped<CookieService>();

builder.Services.AddOpenApi();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseMiddleware<SessionAuthenticationMiddleware>();

app.MapAuthEndpoints();
app.MapUserEndpoints();

app.Run();



// Program.cs (for .NET 6/7 minimal hosting)
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    // Or UseNpgsql / UseSqlite etc.
});

// Core services
builder.Services.AddScoped<ICookieService, CookieService>();
builder.Services.AddScoped<ISessionService, SessionService>();

// Cache service (redis implementation bound to ICacheService)
builder.Services.AddSingleton<ICacheService, RedisCacheService>(); // Your implementation

builder.Services.AddControllers();

var app = builder.Build();

// Session auth middleware before routing/authorization
app.Use(async (ctx, next) =>
{
    // Resolve from DI
    var cookieSvc = ctx.RequestServices.GetRequiredService<ICookieService>();
    var sessionSvc = ctx.RequestServices.GetRequiredService<ISessionService>();
    var middleware = new SessionAuthMiddleware(next, cookieSvc, sessionSvc);
    await middleware.InvokeAsync(ctx);
});

app.MapControllers();

app.Run();
