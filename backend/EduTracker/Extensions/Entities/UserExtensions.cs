using EduTracker.Endpoints.Users;
using EduTracker.Entities;

namespace EduTracker.Extensions.Entities;

public static class UserExtenstions
{
    public static UserResponse ToUserResponse(this User user)
    {
        if (user.SensitiveData is null)
            throw new InvalidOperationException("User does not have sensitive data.");

        UserResponse response = new(
            Id: user.Id,
            FirstName: user.SensitiveData.FirstName,
            MiddleName: user.SensitiveData.MiddleName,
            LastName: user.SensitiveData.LastName,
            UserName: user.UserName,
            Email: user.SensitiveData.Email
        );

        return response;
    }
}