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

        public static readonly OperationFailureResponse NotFound = new(
            Id: "COURSE_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Course not found.",
            Details: []
        );
    }
}
