using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Departments.Handlers.CreateDepartment;
using EduTracker.Api.Endpoints.Departments.Handlers.DeleteDepartment;
using EduTracker.Api.Endpoints.Departments.Handlers.GetDepartments;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Departments;

internal sealed class DepartmentEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Department.Base)
            .WithTags("Departments");

        group.MapPost(ApiRoutes.Department.List, CreateDepartmentEndpointHandler.Handle)
            .WithName(nameof(CreateDepartmentEndpointHandler))
            .WithSummary("Create department")
            .WithDescription(
                $"""
                Creates a new department for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Request Body**:
                - `organizationId` (uuid, required): Organization identifier.
                - `name` (string, required): Department name.
                - `description` (string, optional): Department description.

                **Access**:
                - Only organization owners and moderators can create departments.

                Possible responses:
                - `201 Created`: Department created successfully.
                - `400 BadRequest`: Request body is invalid.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `409 Conflict`: A department with the same name already exists in this organization.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Department.List, GetDepartmentsEndpointHandler.Handle)
            .WithName(nameof(GetDepartmentsEndpointHandler))
            .WithSummary("List departments")
            .WithDescription(
                $"""
                Retrieves all departments for an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Any active organization member can view departments.

                Possible responses:
                - `200 OK`: Departments retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not an active member of the organization.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<DepartmentResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.Department.Delete, DeleteDepartmentEndpointHandler.Handle)
            .WithName(nameof(DeleteDepartmentEndpointHandler))
            .WithSummary("Delete department")
            .WithDescription(
                $"""
                Deletes a department from an organization.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Department identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Only organization owners and moderators can delete departments.

                Possible responses:
                - `200 OK`: Department deleted successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Department was not found in the organization.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();
    }
}
