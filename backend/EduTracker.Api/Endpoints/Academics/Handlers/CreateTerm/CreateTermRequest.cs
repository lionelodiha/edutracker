namespace EduTracker.Api.Endpoints.Academics.Handlers.CreateTerm;

internal sealed record CreateTermRequest(
    Guid OrganizationId,
    Guid SemesterId,
    int Ordinal
);
