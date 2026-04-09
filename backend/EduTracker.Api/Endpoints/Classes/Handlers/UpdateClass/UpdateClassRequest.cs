namespace EduTracker.Api.Endpoints.Classes.Handlers.UpdateClass;

internal sealed record UpdateClassRequest(
    Guid OrganizationId,
    string Name,
    string Code
);
