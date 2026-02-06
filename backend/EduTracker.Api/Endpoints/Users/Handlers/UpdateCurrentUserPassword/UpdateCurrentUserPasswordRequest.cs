namespace EduTracker.Api.Endpoints.Users.Handlers.UpdateCurrentUserPassword;

internal sealed record UpdateCurrentUserPasswordRequest(
    string CurrentPassword,
    string NewPassword,
    bool LogoutAll = false
);
