using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Term
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "TERM_CREATED",
            Title: "Term created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "TERM_RETRIEVED",
            Title: "Term retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "TERM_DELETED",
            Title: "Term deleted successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "TERM_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Term not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "TERM_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A term with this ordinal already exists for the semester.",
            Details: []
        );
    }
}
