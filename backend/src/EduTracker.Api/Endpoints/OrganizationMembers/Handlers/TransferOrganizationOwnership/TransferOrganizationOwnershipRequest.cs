namespace EduTracker.Api.Endpoints.OrganizationMembers.Handlers.TransferOrganizationOwnership;

internal sealed record TransferOrganizationOwnershipRequest(
    Guid MemberId
);
