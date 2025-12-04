using System.Text.Json;
using EduTracker.Constants.Responses;
using EduTracker.Data;
using EduTracker.Entities;
using EduTracker.Extensions.Responses;
using EduTracker.Interfaces.Services;
using EduTracker.Models;

namespace EduTracker.Endpoints.Users.GetUser;

public static class GetUserHandler
{
    public static async Task<IResult> Handle(
        Guid id,
        AppDbContext db,
        IDataEncryptionService dataEncryptionService,
        CancellationToken ct)
    {
        User user = await db.Users.FindAsync([id], cancellationToken: ct)
            ?? throw ResponseCatalog.User.NotFound.ToException();

        var dataBlob = dataEncryptionService.DecryptData(user.EncryptedData);
        var sensitiveData = JsonSerializer.Deserialize<UserSensitive>(dataBlob);

        if (sensitiveData is null)
            return Results.BadRequest("Invalid data");

        user.SetSensitiveData(sensitiveData);

        if (user.SensitiveData is null)
            return Results.BadRequest("Invalid sensitive data");

        UserResponse response = new(
            Id: user.Id,
            FirstName: user.SensitiveData.FirstName,
            MiddleName: user.SensitiveData.MiddleName,
            LastName: user.SensitiveData.LastName,
            UserName: user.UserName,
            Email: user.SensitiveData.Email
        );

        return Results.Ok(ResponseCatalog.User.ProfileRetrieved
            .As<UserResponse>()
            .WithData(response)
            .ToOperationResult()
            .ToApiResponse()
        );
    }
}
