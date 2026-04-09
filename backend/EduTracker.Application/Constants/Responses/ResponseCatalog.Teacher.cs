using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Teacher
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "TEACHER_CREATED",
            Title: "Teacher created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "TEACHER_RETRIEVED",
            Title: "Teacher retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "TEACHER_UPDATED",
            Title: "Teacher updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "TEACHER_DELETED",
            Title: "Teacher deleted successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Joined = new(
            Id: "TEACHER_JOINED",
            Title: "Teacher joined organization successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "TEACHER_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Teacher not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "TEACHER_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A teacher profile already exists for this member or staff ID.",
            Details: []
        );
    }
}
