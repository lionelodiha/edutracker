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
    }
}
