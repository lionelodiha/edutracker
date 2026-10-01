using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Course
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "COURSE_CREATED",
            Title: "Course created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "COURSE_RETRIEVED",
            Title: "Course retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "COURSE_UPDATED",
            Title: "Course updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "COURSE_DELETED",
            Title: "Course deleted successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "COURSE_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Course not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "COURSE_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A course with this code already exists for the organization.",
            Details: []
        );
    }
}
