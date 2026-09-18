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

        public static readonly OperationFailureResponse NotFound = new(
            Id: "CLASS_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Class not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "CLASS_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A class with the same code already exists for this course offering.",
            Details: []
        );
    }
}
