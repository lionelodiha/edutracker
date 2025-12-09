using EduTracker.Data;
using EduTracker.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using EduTracker.Extensions;
using EduTracker.Interfaces.Services;
using EduTracker.Middleware;
using EduTracker.Services;
using FluentValidation;

using EduTracker.Configurations.Security;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));

// Services
builder.Services.Configure<HashingOptions>(builder.Configuration.GetSection("Hashing"));
builder.Services.AddSingleton<IHashingService, HashingService>();
builder.Services.AddSingleton<IDataEncryptionService, AesDataEncryptionService>();
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

// Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>(); 

app.UseAuthorization();

app.MapControllers();

// Seed Default Admin
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();

    // Seed Default Organization and Admin
    if (!context.Organizations.Any())
    {
        var defaultOrg = new Organization
        {
            Id = "org-default",
            Name = "EduTracker Default School",
            SubscriptionStatus = "active"
        };
        context.Organizations.Add(defaultOrg);
        
        if (!context.Users.Any(u => u.Email == "admin@edutracker.com"))
        {
            context.Users.Add(new User
            {
                Id = "admin-1",
                Email = "admin@edutracker.com",
                FirstName = "System",
                LastName = "Administrator",
                Role = "admin",
                Status = "active",
                Password = "admin123",
                AvatarUrl = "https://ui-avatars.com/api/?name=System+Admin",
                OrganizationId = defaultOrg.Id
            });
        }
        context.SaveChanges();
    }
    else if (!context.Users.Any(u => u.Email == "admin@edutracker.com"))
    {
        // Fallback if org exists but admin doesn't
        var defaultOrgId = context.Organizations.First().Id;
        context.Users.Add(new User
        {
            Id = "admin-1",
            Email = "admin@edutracker.com",
            FirstName = "System",
            LastName = "Administrator",
            Role = "admin",
            Status = "active",
            Password = "admin123",
            AvatarUrl = "https://ui-avatars.com/api/?name=System+Admin",
            OrganizationId = defaultOrgId
        });
        context.SaveChanges();
    }

    // Seed Master Admin
    if (!context.Users.Any(u => u.Role == "master_admin"))
    {
        context.Users.Add(new User
        {
            Id = "master-admin-1",
            Email = "master@edutracker.com",
            FirstName = "Master",
            LastName = "Admin",
            Role = "master_admin",
            Status = "active",
            Password = "master123",
            AvatarUrl = "https://ui-avatars.com/api/?name=Master+Admin",
            OrganizationId = null 
        });
        context.SaveChanges();
    }
}

app.Run();