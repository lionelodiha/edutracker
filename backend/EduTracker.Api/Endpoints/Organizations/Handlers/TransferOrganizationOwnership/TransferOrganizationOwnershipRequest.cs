namespace EduTracker.Api.Endpoints.Organizations.Handlers.TransferOrganizationOwnership;

internal sealed record TransferOrganizationOwnershipRequest(
    Guid MemberId
);
