namespace EduTracker.Endpoints.Users.RegisterUser;

public record RegisterUserRequest(
    string FirstName,
    string MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password
);
