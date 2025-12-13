namespace EduTracker.Endpoints.Auth.LoginUser;

public record LoginUserRequest(
    string Identifier,
    string Password,
    bool RememberMe
);
