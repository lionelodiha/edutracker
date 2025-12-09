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

using EduTracker.Endpoints.Users;
using EduTracker.Endpoints.Users.RegisterUser;
using EntityUser = EduTracker.Entities.User;

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
builder.Services.Configure<DataEncryptionOptions>(builder.Configuration.GetSection("DataEncryption"));
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

    var hashingService = scope.ServiceProvider.GetRequiredService<IHashingService>();
    var encryptionService = scope.ServiceProvider.GetRequiredService<IDataEncryptionService>();

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

        string adminEmail = "admin@edutracker.com";
        string emailHash = hashingService.HashEmail(adminEmail);

        if (!context.Users.Any(u => u.EmailHash == emailHash))
        {
            var registerRequest = new RegisterUserRequest(
                "System",
                "",
                "Administrator",
                "admin",
                adminEmail,
                "admin123"
            );

            string passwordHash = hashingService.HashPassword(registerRequest.Password);

            EntityUser adminUser = UserFactory.Create(
                registerRequest,
                adminEmail,
                emailHash,
                passwordHash,
                encryptionService
            );

            adminUser.SetRole("admin");
            adminUser.SetStatus("active");
            adminUser.SetAvatarUrl("https://ui-avatars.com/api/?name=System+Admin");
            adminUser.SetOrganizationId(defaultOrg.Id);

            context.Users.Add(adminUser);
        }
        context.SaveChanges();
    }
    
    // Seed Master Admin
    string masterEmail = "master@edutracker.com";
    string masterEmailHash = hashingService.HashEmail(masterEmail);

    if (!context.Users.Any(u => u.Role == "master_admin"))
    {
        var registerRequest = new RegisterUserRequest(
            "Master",
            "",
            "Admin",
            "masteradmin",
            masterEmail,
            "master123"
        );

        string passwordHash = hashingService.HashPassword(registerRequest.Password);

        EntityUser masterUser = UserFactory.Create(
            registerRequest,
            masterEmail,
            masterEmailHash,
            passwordHash,
            encryptionService
        );

        masterUser.SetRole("master_admin");
        masterUser.SetStatus("active");
        masterUser.SetAvatarUrl("https://ui-avatars.com/api/?name=Master+Admin");
        masterUser.SetOrganizationId(null);

        context.Users.Add(masterUser);
        context.SaveChanges();
    }
}

app.Run();
