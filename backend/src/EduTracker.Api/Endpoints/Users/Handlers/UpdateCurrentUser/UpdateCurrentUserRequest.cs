namespace EduTracker.Api.Endpoints.Users.Handlers.UpdateCurrentUser;

internal sealed record UpdateCurrentUserRequest(
    string? FirstName,
    string? MiddleName,
    string? LastName,
    string? UserName
);
