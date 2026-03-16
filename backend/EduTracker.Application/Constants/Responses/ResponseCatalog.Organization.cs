using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Organization
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "ORG_CREATED",
            Title: "Organization created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "ORG_RETRIEVED",
            Title: "Organization retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse MembersRetrieved = new(
            Id: "ORG_MEMBERS_RETRIEVED",
            Title: "Organization members retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse MemberInvited = new(
            Id: "ORG_MEMBER_INVITED",
            Title: "Organization member invited successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse MemberRoleUpdated = new(
            Id: "ORG_MEMBER_ROLE_UPDATED",
            Title: "Organization member role updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "ORG_DELETED",
            Title: "Organization deleted successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "ORG_UPDATED",
            Title: "Organization updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse InviteAccepted = new(
            Id: "ORG_INVITE_ACCEPTED",
            Title: "Organization invite accepted successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse InviteRejected = new(
            Id: "ORG_INVITE_REJECTED",
            Title: "Organization invite rejected successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse InviteCancelled = new(
            Id: "ORG_INVITE_CANCELLED",
            Title: "Organization invite cancelled successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse InvitesRetrieved = new(
            Id: "ORG_INVITES_RETRIEVED",
            Title: "Organization invites retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse MemberRemoved = new(
            Id: "ORG_MEMBER_REMOVED",
            Title: "Organization member removed successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse OwnershipTransferred = new(
            Id: "ORG_OWNERSHIP_TRANSFERRED",
            Title: "Organization ownership transferred successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "ORG_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Organization not found.",
            Details: []
        );

        public static readonly OperationFailureResponse MemberNotFound = new(
            Id: "ORG_MEMBER_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Organization member not found.",
            Details: []
        );

        public static readonly OperationFailureResponse MemberAlreadyExists = new(
            Id: "ORG_MEMBER_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "User is already a member of this organization.",
            Details: []
        );

        public static readonly OperationFailureResponse InviteNotFound = new(
            Id: "ORG_INVITE_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Organization invite not found.",
            Details: []
        );

        public static readonly OperationFailureResponse InviteExpired = new(
            Id: "ORG_INVITE_EXPIRED",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Organization invite has expired.",
            Details: []
        );

        public static readonly OperationFailureResponse InviteAlreadyResponded = new(
            Id: "ORG_INVITE_ALREADY_RESPONDED",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Organization invite has already been sent or responded to.",
            Details: []
        );

        public static readonly OperationFailureResponse CannotRemoveOwner = new(
            Id: "ORG_CANNOT_REMOVE_OWNER",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Organization owner cannot be removed.",
            Details: []
        );

        public static readonly OperationFailureResponse CannotRemoveSuperior = new(
            Id: "ORG_CANNOT_REMOVE_SUPERIOR",
            StatusCode: HttpStatusCodes.Forbidden,
            Title: "You cannot remove a member with an equal or higher role.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyOwner = new(
            Id: "ORG_ALREADY_OWNER",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Organization owner role can only be transferred.",
            Details: []
        );

        public static readonly OperationFailureResponse Locked = new(
            Id: "ORG_LOCKED",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Organization is currently locked.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyMember = new(
            Id: "ORG_ALREADY_MEMBER",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "User is already a member of this organization.",
            Details: []
        );
    }
}
