using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.GetOrganizations;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizations;

internal static class GetOrganizationsEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        GetOrganizationsQuery query = new(userId);
        OperationResult<IReadOnlyList<OrganizationListItemResponse>> result = await mediator.Send(query, cancellationToken);

        ApiResponse<IReadOnlyList<OrganizationListItemResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
