using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.GetOrganizationMembers;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationMembers;

internal static class GetOrganizationMembersEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        GetOrganizationMembersQuery query = new(actorId, id);
        OperationResult<IReadOnlyList<OrganizationMemberResponse>> result = await mediator.Send(query, cancellationToken);

        ApiResponse<IReadOnlyList<OrganizationMemberResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
