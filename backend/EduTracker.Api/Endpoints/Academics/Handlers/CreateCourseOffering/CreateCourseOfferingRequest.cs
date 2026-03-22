namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateCourseOffering;

internal sealed record CreateCourseOfferingRequest(
    Guid OrganizationId,
    Guid CourseId,
    Guid SemesterId
);
