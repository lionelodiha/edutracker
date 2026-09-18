using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Department
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "DEPARTMENT_CREATED",
            Title: "Department created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "DEPARTMENT_RETRIEVED",
            Title: "Departments retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "DEPARTMENT_DELETED",
            Title: "Department deleted successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "DEPARTMENT_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Department not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "DEPARTMENT_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A department with this name already exists in this organization.",
            Details: []
        );

        public static readonly OperationFailureResponse FacultyNotFound = new(
            Id: "DEPARTMENT_FACULTY_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "The selected faculty was not found in this organization.",
            Details: []
        );
    }
}
