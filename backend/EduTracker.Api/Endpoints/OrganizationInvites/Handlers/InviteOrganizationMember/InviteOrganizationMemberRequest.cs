namespace EduTracker.Api.Endpoints.OrganizationInvites.Handlers.InviteOrganizationMember;

internal sealed record InviteOrganizationMemberRequest(
    Guid? UserId,
    string? UserName
);
