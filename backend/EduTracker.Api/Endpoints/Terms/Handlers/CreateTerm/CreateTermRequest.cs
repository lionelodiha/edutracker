namespace EduTracker.Api.Endpoints.Terms.Handlers.CreateTerm;

internal sealed record CreateTermRequest(
    Guid OrganizationId,
    Guid SemesterId,
    int Ordinal
);
