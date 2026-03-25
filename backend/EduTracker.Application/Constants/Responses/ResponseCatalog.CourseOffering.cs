using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class CourseOffering
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "COURSE_OFFERING_CREATED",
            Title: "Course offering created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "COURSE_OFFERING_RETRIEVED",
            Title: "Course offerings retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "COURSE_OFFERING_DELETED",
            Title: "Course offering deleted successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "COURSE_OFFERING_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Course offering not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "COURSE_OFFERING_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "This course has already been linked to the term.",
            Details: []
        );

        public static readonly OperationFailureResponse OrganizationMismatch = new(
            Id: "COURSE_OFFERING_ORGANIZATION_MISMATCH",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Course and term must belong to the same organization.",
            Details: []
        );
    }
}
