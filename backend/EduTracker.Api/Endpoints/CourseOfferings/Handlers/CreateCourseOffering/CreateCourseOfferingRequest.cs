namespace EduTracker.Api.Endpoints.CourseOfferings.Handlers.CreateCourseOffering;

internal sealed record CreateCourseOfferingRequest(
    Guid OrganizationId,
    Guid CourseId,
    Guid TermId
);
