namespace EduTracker.Api.Endpoints.Departments.Handlers.CreateDepartment;

internal sealed record CreateDepartmentRequest(
    Guid OrganizationId,
    Guid? FacultyId,
    string Name,
    string? Description
);
