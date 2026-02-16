using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Enrollment
    {
        public static readonly OperationOutcomeResponse Enrolled = new(
            Id: "ENROLLMENT_CREATED",
            Title: "Student enrolled successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyEnrolled = new(
            Id: "ENROLLMENT_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Student is already enrolled in this class.",
            Details: []
        );
    }
}
