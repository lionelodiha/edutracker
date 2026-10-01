using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Courses.Handlers.CreateCourse;
using EduTracker.Api.Endpoints.Courses.Handlers.DeleteCourse;
using EduTracker.Api.Endpoints.Courses.Handlers.GetCourseById;
using EduTracker.Api.Endpoints.Courses.Handlers.GetCourses;
using EduTracker.Api.Endpoints.Courses.Handlers.UpdateCourse;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Courses;

internal sealed class CourseEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Course.Base)
            .WithTags("Courses");

        group.MapPost(ApiRoutes.Course.List, CreateCourseEndpointHandler.Handle)
            .WithName(nameof(CreateCourseEndpointHandler))
            .WithSummary("Create course")
            .WithDescription(
                $"""
                Creates a new course for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Request Body**:
                - `organizationId` (uuid, required): Organization identifier.
                - `name` (string, required): Course name.
                - `code` (string, required): Course code.

                **Access**:
                - Only organization owners and moderators can create courses.

                Possible responses:
                - `201 Created`: Course created successfully.
                - `400 BadRequest`: Request body is invalid.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `409 Conflict`: A course with the same code already exists.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Course.List, GetCoursesEndpointHandler.Handle)
            .WithName(nameof(GetCoursesEndpointHandler))
            .WithSummary("List courses")
            .WithDescription(
                $"""
                Retrieves all courses for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Any active organization member can view courses.

                Possible responses:
                - `200 OK`: Courses retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not an active member of the organization.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<CourseResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Course.GetById, GetCourseByIdEndpointHandler.Handle)
            .WithName(nameof(GetCourseByIdEndpointHandler))
            .WithSummary("Get course by id")
            .WithDescription(
                $"""
                Retrieves a single course by ID for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Course identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Any active organization member can view the course.

                Possible responses:
                - `200 OK`: Course retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not an active member of the organization.
                - `404 NotFound`: Course was not found in the organization.
                """
            )
            .Produces<ApiResponse<CourseResponse>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPatch(ApiRoutes.Course.Update, UpdateCourseEndpointHandler.Handle)
            .WithName(nameof(UpdateCourseEndpointHandler))
            .WithSummary("Update course")
            .WithDescription(
                $"""
                Updates an existing course.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Course identifier.

                **Request Body**:
                - `organizationId` (uuid, required): Organization identifier.
                - `name` (string, required): Updated course name.
                - `code` (string, required): Updated course code.

                **Access**:
                - Only organization owners and moderators can update courses.

                Possible responses:
                - `200 OK`: Course updated successfully.
                - `400 BadRequest`: Request body is invalid.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Course was not found in the organization.
                - `409 Conflict`: Another course already uses the requested code.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.Course.Delete, DeleteCourseEndpointHandler.Handle)
            .WithName(nameof(DeleteCourseEndpointHandler))
            .WithSummary("Delete course")
            .WithDescription(
                $"""
                Deletes a course from an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Course identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Only organization owners and moderators can delete courses.

                Possible responses:
                - `200 OK`: Course deleted successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Course was not found in the organization.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();
    }
}
