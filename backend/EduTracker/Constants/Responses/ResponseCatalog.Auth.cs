using EduTracker.Common.Responses;
using EduTracker.Enums;
using EduTracker.Models;

namespace EduTracker.Constants.Responses;

public static partial class ResponseCatalog
{
    public static class Auth
    {
        public static readonly OperationOutcomeResponse RegisterSuccessful = new(
            Id: "AUTH_REGISTER_SUCCESS",
            Title: "Registration successful.",
            Details: [
                new ResponseDetail(
                    Message: "Your account has been created successfully.",
                    Severity: ResponseSeverity.Info
                )
            ]
        );

        public static readonly OperationFailureResponse UnAuthorized = new(
            Id: "AUTH_UNAUTHORIZED",
            StatusCode: StatusCodes.Status401Unauthorized,
            Title: "Unauthorized access.",
            Details: [
                new ResponseDetail(
                    Message: "You need to log in to access this resource.",
                    Severity: ResponseSeverity.Warning
                )
            ]
        );
    }
}
