using System.Text.Json;
using EduTracker.Endpoints.Users.RegisterUser;
using EduTracker.Entities;
using EduTracker.Interfaces.Services;
using EduTracker.Models;

namespace EduTracker.Endpoints.Users;

public class UserFactory
{
    public static User Create(RegisterUserRequest request, string normalizedEmail, string emailHash, string passwordHash, IDataEncryptionService dataEncryptionService)
    {
        User user = new(request.UserName.Trim(), emailHash, passwordHash);

        UserSensitive sensitiveData = new()
        {
            FirstName = request.FirstName.Trim(),
            MiddleName = request.MiddleName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail
        };

        byte[] dataBlob = JsonSerializer.SerializeToUtf8Bytes(sensitiveData);
        byte[] encryptedData = dataEncryptionService.EncryptData(dataBlob);

        user.SetSensitiveData(sensitiveData);
        user.SetEncryptedData(encryptedData);

        return user;
    }
}
