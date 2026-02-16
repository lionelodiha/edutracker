using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Grade
    {
        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "GRADE_RETRIEVED",
            Title: "Grades retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Recorded = new(
            Id: "GRADE_RECORDED",
            Title: "Grade recorded successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "GRADE_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Grade not found.",
            Details: []
        );
    }
}
