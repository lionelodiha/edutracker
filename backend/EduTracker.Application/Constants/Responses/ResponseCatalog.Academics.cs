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

        public static readonly OperationOutcomeResponse Updated = new(
            Id: "SEMESTER_UPDATED",
            Title: "Semester updated successfully.",
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
            Title: "A semester with this session already exists for the organization.",
            Details: []
        );
    }

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
            Title: "This course has already been linked to the semester.",
            Details: []
        );

        public static readonly OperationFailureResponse OrganizationMismatch = new(
            Id: "COURSE_OFFERING_ORGANIZATION_MISMATCH",
            StatusCode: HttpStatusCodes.Conflict,
            Title: "Course and semester must belong to the same organization.",
            Details: []
        );
    }
}
