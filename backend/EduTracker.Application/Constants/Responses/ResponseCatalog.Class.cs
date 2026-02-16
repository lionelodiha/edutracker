using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Class
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "CLASS_CREATED",
            Title: "Class created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "CLASS_RETRIEVED",
            Title: "Class retrieved successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "CLASS_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Class not found.",
            Details: []
        );
    }
}
