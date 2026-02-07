using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Endpoints.Organizations.Handlers.CreateOrganization;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationById;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationMembers;
using EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizations;
using EduTracker.Api.Endpoints.Organizations.Handlers.InviteOrganizationMember;
using EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganizationMemberRole;
using EduTracker.Api.Models;
using EduTracker.Application.Features.Organizations.Models;
using Scalar.AspNetCore;

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
                .Produces<ApiResponse<object>>(StatusCodes.Status201Created)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.List, GetOrganizationsEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationsEndpointHandler))
                .WithSummary("List organizations")
                .Produces<ApiResponse<IReadOnlyList<OrganizationListItemResponse>>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.GetById, GetOrganizationByIdEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationByIdEndpointHandler))
                .WithSummary("Get organization by id")
                .Produces<ApiResponse<OrganizationResponse>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapPost(ApiRoutes.Organization.Invite, InviteOrganizationMemberEndpointHandler.Handle)
                .WithName(nameof(InviteOrganizationMemberEndpointHandler))
                .WithSummary("Invite organization member")
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapPatch(ApiRoutes.Organization.UpdateMemberRole, UpdateOrganizationMemberRoleEndpointHandler.Handle)
                .WithName(nameof(UpdateOrganizationMemberRoleEndpointHandler))
                .WithSummary("Update organization member role")
                .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
                .RequireAuthorization();

            group.MapGet(ApiRoutes.Organization.Members, GetOrganizationMembersEndpointHandler.Handle)
                .WithName(nameof(GetOrganizationMembersEndpointHandler))
                .WithSummary("Get organization members")
                .Produces<ApiResponse<IReadOnlyList<OrganizationMemberResponse>>>(StatusCodes.Status200OK)
                .RequireAuthorization();
        }
    }
}
