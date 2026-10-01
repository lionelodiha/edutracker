using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationInvites.GetUserInvites;
using EduTracker.Application.Features.OrganizationInvites.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.OrganizationInvites.Handlers.GetUserInvites;

internal static class GetUserInvitesEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        GetUserInvitesQuery query = new(userId);
        OperationResult<IReadOnlyList<UserOrganizationInviteResponse>> result = await mediator.Send(query, cancellationToken);

        ApiResponse<IReadOnlyList<UserOrganizationInviteResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
