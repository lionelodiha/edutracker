using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Organizations.Handlers.CreateOrganization;
using EduTracker.Api.Endpoints.Organizations.Handlers.DeleteOrganization;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationById;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizations;
using EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganization;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Organizations.Models;

namespace EduTracker.Api.Endpoints.Organizations;

internal static class OrganizationEndpoints
{
    extension(IEndpointRouteBuilder app)
    {
        public void MapOrganizationEndpoints()
        {
            RouteGroupBuilder group = app.MapGroup(ApiRoutes.Organization.Base)
                .WithTags("Organizations");

            group.MapPost(ApiRoutes.Organization.List, CreateOrganizationEndpointHandler.Handle)
                .WithName(nameof(CreateOrganizationEndpointHandler))
                .WithSummary("Create organization")
                .WithDescription(
                    $"""
                    Creates a new organization owned by the current user.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Request Body**:
                    - `Name` (string, required): Organization name.

                    Possible responses:
                    - `201 Created`: Organization created successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.List, GetOrganizationsEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationsEndpointHandler))
                .WithSummary("List organizations")
                .WithDescription(
                    $"""
                    Retrieves organizations the current user belongs to.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    The response includes:
                    - `OrganizationId`, `Name`
                    - `Role`, `Status`

                    Possible responses:
                    - `200 OK`: Organizations retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<IReadOnlyList<OrganizationListItemResponse>>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.GetById, GetOrganizationByIdEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationByIdEndpointHandler))
                .WithSummary("Get organization by id")
                .WithDescription(
                    $"""
                    Retrieves organization details by ID. Only active members can access this endpoint.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    Possible responses:
                    - `200 OK`: Organization retrieved successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not an active member of the organization.
                    - `404 NotFound`: Organization not found.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<OrganizationResponse>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapDelete(ApiRoutes.Organization.Delete, DeleteOrganizationEndpointHandler.Handle)
                .WithName(nameof(DeleteOrganizationEndpointHandler))
                .WithSummary("Delete organization")
                .WithDescription(
                    $"""
                    Deletes an organization. Only the owner can delete an organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    Possible responses:
                    - `200 OK`: Organization deleted successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not the organization owner.
                    - `404 NotFound`: Organization not found.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();

            group.MapPatch(ApiRoutes.Organization.Update, UpdateOrganizationEndpointHandler.Handle)
                .WithName(nameof(UpdateOrganizationEndpointHandler))
                .WithSummary("Update organization")
                .WithDescription(
                    $"""
                    Updates an organization name. Only the owner can update the organization.

                    **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                    **Route Parameters**:
                    - `id` (uuid): Organization identifier.

                    **Request Body**:
                    - `Name` (string, required): New organization name.

                    Possible responses:
                    - `200 OK`: Organization updated successfully.
                    - `401 Unauthorized`: No valid session or session expired.
                    - `403 Forbidden`: User is not the organization owner.
                    - `404 NotFound`: Organization not found.
                    - `409 Conflict`: Organization is locked.
                    - `500 InternalServerError`: Unexpected server error.
                    """
                )
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
                .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
                .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
                .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
                .Produces<ApiResponse<object>>(StatusCodes.Status500InternalServerError)
                .RequireAuthorization();
        }
    }
}
