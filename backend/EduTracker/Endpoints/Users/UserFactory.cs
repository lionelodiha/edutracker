using EduTracker.Endpoints.Users.RegisterUser;
using EduTracker.Entities;
using EduTracker.Interfaces.Services;
using EduTracker.Models;

namespace EduTracker.Endpoints.Users;

public class UserFactory
{
    public static User Create(
        RegisterUserRequest request,
        string normalizedEmail,
        string passwordHash,
        string emailHash,
        IDataEncryptionService dataEncryptionService)
    {
        User user = new(request.UserName.Trim(), emailHash, passwordHash);

        UserSensitive sensitive = new()
        {
            FirstName = request.FirstName,
            MiddleName = request.MiddleName,
            LastName = request.LastName,
            Email = request.Email
        };

        byte[] dataBlob = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(sensitive);
        byte[] encryptedData = dataEncryptionService.EncryptData(dataBlob);
        user.SetEncryptedData(encryptedData);

        return user;
    }
}
