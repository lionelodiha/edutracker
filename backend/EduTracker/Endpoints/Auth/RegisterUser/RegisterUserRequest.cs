namespace EduTracker.Endpoints.Auth.RegisterUser;

public record RegisterUserRequest(
    string FirstName,
    string MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password
);
