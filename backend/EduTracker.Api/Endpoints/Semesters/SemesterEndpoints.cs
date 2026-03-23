using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Semesters.Handlers.CreateSemester;
using EduTracker.Api.Endpoints.Semesters.Handlers.DeleteSemester;
using EduTracker.Api.Endpoints.Semesters.Handlers.GetSemesterById;
using EduTracker.Api.Endpoints.Semesters.Handlers.GetSemesters;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Semesters;

internal static class SemesterEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapSemesterEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Semester.Base)
                .WithTags("Semesters");

            group.MapPost(ApiRoutes.Semester.List, CreateSemesterEndpointHandler.Handle)
                .WithName(nameof(CreateSemesterEndpointHandler))
                .WithSummary("Create semester")
                .WithDescription(
                    $"""
                    Creates a new semester for an organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Request Body**:
                    - `organizationId` (uuid, required): Organization identifier.
                    - `startYear` (number, required): Semester start year.

                    **Access**:
                    - Only organization owners and moderators can create semesters.

                    Possible responses:
                    - `201 Created`: Semester created successfully.
                    - `400 BadRequest`: Request body is invalid.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not allowed to manage academics for the organization.
                    - `409 Conflict`: Semester already exists for the given start year.
                    """
                )
                .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
                .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Semester.List, GetSemestersEndpointHandler.Handle)
                .WithName(nameof(GetSemestersEndpointHandler))
                .WithSummary("List semesters")
                .WithDescription(
                    $"""
                    Retrieves semesters for an organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Query Parameters**:
                    - `organizationId` (uuid, required): Organization identifier.

                    **Access**:
                    - Any active organization member can view semesters.

                    Possible responses:
                    - `200 OK`: Semesters retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not an active member of the organization.
                    """
                )
                .Produces<ApiResponse<IReadOnlyList<SemesterResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Semester.GetById, GetSemesterByIdEndpointHandler.Handle)
                .WithName(nameof(GetSemesterByIdEndpointHandler))
                .WithSummary("Get semester by id")
                .WithDescription(
                    $"""
                    Retrieves a semester by ID for an organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Semester identifier.

                    **Query Parameters**:
                    - `organizationId` (uuid, required): Organization identifier.

                    **Access**:
                    - Any active organization member can view semesters.

                    Possible responses:
                    - `200 OK`: Semester retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not an active member of the organization.
                    - `404 NotFound`: Semester was not found in the organization.
                    """
                )
                .Produces<ApiResponse<SemesterResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .RequireAuthorization();

            group.MapDelete(ApiRoutes.Semester.Delete, DeleteSemesterEndpointHandler.Handle)
                .WithName(nameof(DeleteSemesterEndpointHandler))
                .WithSummary("Delete semester")
                .WithDescription(
                    $"""
                    Deletes a semester from an organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Semester identifier.

                    **Query Parameters**:
                    - `organizationId` (uuid, required): Organization identifier.

                    **Access**:
                    - Only organization owners and moderators can delete semesters.

                    Possible responses:
                    - `200 OK`: Semester deleted successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not allowed to manage academics for the organization.
                    - `404 NotFound`: Semester was not found in the organization.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .RequireAuthorization();
        }
    }
}
