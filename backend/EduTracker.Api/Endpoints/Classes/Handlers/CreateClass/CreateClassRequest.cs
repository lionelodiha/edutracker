namespace EduTracker.Api.Endpoints.Classes.Handlers.CreateClass;

internal sealed record CreateClassRequest(
    Guid OrganizationId,
    string Name,
    string Code
);
