using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Semester
    {
        public static readonly OperationOutcomeResponse Created = new(
            Id: "SEMESTER_CREATED",
            Title: "Semester created successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "SEMESTER_RETRIEVED",
            Title: "Semester retrieved successfully.",
            Details: []
        );

        public static readonly OperationOutcomeResponse Deleted = new(
            Id: "SEMESTER_DELETED",
            Title: "Semester deleted successfully.",
            Details: []
        );

        public static readonly OperationFailureResponse NotFound = new(
            Id: "SEMESTER_NOT_FOUND",
            StatusCode: HttpStatusCodes.NotFound,
            Title: "Semester not found.",
            Details: []
        );

        public static readonly OperationFailureResponse AlreadyExists = new(
            Id: "SEMESTER_ALREADY_EXISTS",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "A semester with this start year already exists for the organization.",
            Details: []
        );
    }
}
