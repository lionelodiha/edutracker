using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.GetOrganizationInvites;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationInvites;

internal static class GetOrganizationInvitesEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        GetOrganizationInvitesQuery query = new(actorId, id);
        OperationResult<IReadOnlyList<OrganizationInviteResponse>> result = await mediator.Send(query, cancellationToken);

        ApiResponse<IReadOnlyList<OrganizationInviteResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
