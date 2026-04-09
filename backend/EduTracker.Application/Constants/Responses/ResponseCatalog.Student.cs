using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Student
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "STUDENT_CREATED",
            Title: "Student created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "STUDENT_RETRIEVED",
            Title: "Student retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "STUDENT_UPDATED",
            Title: "Student updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "STUDENT_DELETED",
            Title: "Student deleted successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Joined = new(
            Id: "STUDENT_JOINED",
            Title: "Student joined organization successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "STUDENT_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Student not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "STUDENT_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A student profile already exists for this member or student number.",
            Details: []
        );
    }
}
