namespace EduTracker.Api.Endpoints.Auth.Handlers.LoginUser;

internal sealed record LoginUserRequest(
    string Identifier,
    string Password,
    bool RememberMe = false
);
