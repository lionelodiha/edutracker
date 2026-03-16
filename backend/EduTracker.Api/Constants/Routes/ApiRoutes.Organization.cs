namespace EduTracker.Api.Constants.Routes;

internal static partial class ApiRoutes
{
    public static class Organization
    {
        public const string Base = $"{ApiBasePath}/organizations";

        public const string List = "";
        public const string GetById = "/{id:guid}";
        public const string Delete = "/{id:guid}";
        public const string Update = "/{id:guid}";
        public const string TransferOwnership = "/{id:guid}/transfer-ownership";
        public const string Invite = "/{id:guid}/invite";
        public const string Members = "/{id:guid}/members";
        public const string RemoveMember = "/{id:guid}/members/{memberId:guid}";
        public const string UpdateMemberRole = "/{id:guid}/members/{memberId:guid}/role";
        public const string OrgInvites = "/{id:guid}/invites";
        public const string AcceptInvite = "/invites/{inviteId:guid}/accept";
        public const string RejectInvite = "/invites/{inviteId:guid}/reject";
        public const string CancelInvite = "/{id:guid}/invites/{inviteId:guid}/cancel";
        public const string UserInvites = "/invites";
    }
}
