using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class System
    {
        public static readonly OperationOutcomeResponse Ok = new(
            Id: "SYSTEM_OK",
            Title: "Operation completed successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse SuperAdminSeeded = new(
            Id: "SYSTEM_SUPERADMIN_SEEDED",
            Title: "Super administrator seeded successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse MissingRequiredField = new(
            Id: "SYSTEM_MISSING_REQUIRED_FIELD",
            StatusCode: HttpStatusCodes.BadRequest,
            Title: "A required field was missing.",
            Details: []
        );

        public static readonly OperationFailureResponse RelatedRecordNotFound = new(Id: "SYSTEM_RELATED_RECORD_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "A related record was not found.",
            Details: []
        );

        public static readonly OperationFailureResponse DuplicateRecord = new(
            Id: "SYSTEM_DUPLICATE_RECORD",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A record with these values already exists.",
            Details: []
        );

        public static readonly OperationFailureResponse Unexpected = new(
            Id: "COMMON_UNKNOWN_ERROR",
            StatusCode: HttpStatusCodes.InternalServerError,
            Title: "An unexpected error occurred. Please try again later.",
            Details: []
        );
    }
}
