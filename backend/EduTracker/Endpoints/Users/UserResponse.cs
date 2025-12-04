namespace EduTracker.Endpoints.Users;

public record UserResponse(
    Guid Id,
    string FirstName,
    string MiddleName,
    string LastName,
    string UserName,
    string Email
);
