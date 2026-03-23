using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.CourseOfferings.Handlers.CreateCourseOffering;
using EduTracker.Api.Endpoints.CourseOfferings.Handlers.DeleteCourseOffering;
using EduTracker.Api.Endpoints.CourseOfferings.Handlers.GetCourseOfferingsBySemester;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.CourseOfferings;

internal sealed class CourseOfferingEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.CourseOffering.Base)
            .WithTags("Course Offerings");

        group.MapPost(ApiRoutes.CourseOffering.Create, CreateCourseOfferingEndpointHandler.Handle)
            .WithName(nameof(CreateCourseOfferingEndpointHandler))
            .WithSummary("Create course offering")
            .WithDescription(
                $"""
                Creates a course offering by linking a course to a term.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Request Body**:
                - `organizationId` (uuid, required): Organization identifier.
                - `courseId` (uuid, required): Course identifier.
                - `termId` (uuid, required): Term identifier.

                **Access**:
                - Only organization owners and moderators can create course offerings.

                Possible responses:
                - `201 Created`: Course offering created successfully.
                - `400 BadRequest`: Request body is invalid.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Course or term was not found in the organization.
                - `409 Conflict`: Course offering already exists or the entities do not belong to the same organization.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.CourseOffering.ListBySemester, GetCourseOfferingsBySemesterEndpointHandler.Handle)
            .WithName(nameof(GetCourseOfferingsBySemesterEndpointHandler))
            .WithSummary("List course offerings by semester")
            .WithDescription(
                $"""
                Retrieves course offerings for a semester.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `semesterId` (uuid): Semester identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Any active organization member can view course offerings.

                Possible responses:
                - `200 OK`: Course offerings retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not an active member of the organization.
                - `404 NotFound`: Semester was not found in the organization.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<CourseOfferingResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.CourseOffering.Delete, DeleteCourseOfferingEndpointHandler.Handle)
            .WithName(nameof(DeleteCourseOfferingEndpointHandler))
            .WithSummary("Delete course offering")
            .WithDescription(
                $"""
                Deletes a course offering from an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Course offering identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Only organization owners and moderators can delete course offerings.

                Possible responses:
                - `200 OK`: Course offering deleted successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Course offering was not found in the organization.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();
    }
}
