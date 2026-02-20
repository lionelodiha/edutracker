namespace EduTracker.Api.Endpoints.Organizations.Handlers.InviteOrganizationMember;

internal sealed record InviteOrganizationMemberRequest(
    Guid UserId,
    string RoleKey
);
