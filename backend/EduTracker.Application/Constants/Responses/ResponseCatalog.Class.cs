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

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "CLASS_UPDATED",
            Title: "Class updated successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "CLASS_DELETED",
            Title: "Class deleted successfully.",
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
            Title: "A class with this code already exists for the organization.",
            Details: []
        );

        public static readonly OperationFailureResponse HasAssignedStudents = new(
            Id: "CLASS_HAS_ASSIGNED_STUDENTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "This class cannot be deleted while students are assigned to it.",
            Details: []
        );
    }
}
