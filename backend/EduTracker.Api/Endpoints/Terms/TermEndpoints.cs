using EduTracker.Api.Constants.Cookies;
using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Terms.Handlers.CreateTerm;
using EduTracker.Api.Endpoints.Terms.Handlers.DeleteTerm;
using EduTracker.Api.Endpoints.Terms.Handlers.GetTermById;
using EduTracker.Api.Endpoints.Terms.Handlers.GetTermsBySemester;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Models;

namespace EduTracker.Api.Endpoints.Terms;

internal sealed class TermEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup(ApiRoutes.Term.Base)
            .WithTags("Terms");

        group.MapPost(ApiRoutes.Term.Create, CreateTermEndpointHandler.Handle)
            .WithName(nameof(CreateTermEndpointHandler))
            .WithSummary("Create term")
            .WithDescription(
                $"""
                Creates a term inside a semester.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Request Body**:
                - `organizationId` (uuid, required): Organization identifier.
                - `semesterId` (uuid, required): Semester identifier.
                - `ordinal` (number, required): Term position within the semester.

                **Access**:
                - Only organization owners and moderators can create terms.

                Possible responses:
                - `201 Created`: Term created successfully.
                - `400 BadRequest`: Request body is invalid.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Semester was not found in the organization.
                - `409 Conflict`: Term already exists for the semester and ordinal.
                """
            )
            .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
            .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Term.ListBySemester, GetTermsBySemesterEndpointHandler.Handle)
            .WithName(nameof(GetTermsBySemesterEndpointHandler))
            .WithSummary("List terms by semester")
            .WithDescription(
                $"""
                Retrieves all terms for a semester.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `semesterId` (uuid): Semester identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Any active organization member can view terms.

                Possible responses:
                - `200 OK`: Terms retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not an active member of the organization.
                - `404 NotFound`: Semester was not found in the organization.
                """
            )
            .Produces<ApiResponse<IReadOnlyList<TermResponse>>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapGet(ApiRoutes.Term.GetById, GetTermByIdEndpointHandler.Handle)
            .WithName(nameof(GetTermByIdEndpointHandler))
            .WithSummary("Get term by id")
            .WithDescription(
                $"""
                Retrieves a term by ID.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Term identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Any active organization member can view terms.

                Possible responses:
                - `200 OK`: Term retrieved successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not an active member of the organization.
                - `404 NotFound`: Term was not found in the organization.
                """
            )
            .Produces<ApiResponse<TermResponse>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapDelete(ApiRoutes.Term.Delete, DeleteTermEndpointHandler.Handle)
            .WithName(nameof(DeleteTermEndpointHandler))
            .WithSummary("Delete term")
            .WithDescription(
                $"""
                Deletes a term from a semester.

                **Authentication Required**: A valid session (`{CookieKeys.Session}` cookie) is needed.

                **Route Parameters**:
                - `id` (uuid): Term identifier.

                **Query Parameters**:
                - `organizationId` (uuid, required): Organization identifier.

                **Access**:
                - Only organization owners and moderators can delete terms.

                Possible responses:
                - `200 OK`: Term deleted successfully.
                - `401 Unauthorized`: No valid session or session expired.
                - `403 Forbidden`: User is not allowed to manage academics for the organization.
                - `404 NotFound`: Term was not found in the organization.
                """
            )
            .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
            .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
            .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
            .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound)
            .RequireAuthorization();
    }
}
