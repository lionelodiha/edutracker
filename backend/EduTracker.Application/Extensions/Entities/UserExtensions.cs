using EduTracker.Application.Features.Users.Models;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Extensions.Entities;

internal static class UserExtensions
{
    extension(User user)
    {
        public UserResponse ToUserResponse()
        {
            if (user.SensitiveData is null)
                throw new InvalidOperationException("User sensitive data has not been decrypted.");

            UserSensitive data = user.SensitiveData;

            return new UserResponse(
                user.Id,
                user.UserName,
                data.FirstName,
                data.MiddleName,
                data.LastName,
                user.Role
            );
        }
    }
}
