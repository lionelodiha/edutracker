using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.GetOrganizationById;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.GetOrganizationById;

internal static class GetOrganizationByIdEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        GetOrganizationByIdQuery query = new(userId, id);
        OperationResult<OrganizationResponse> result = await mediator.Send(query, cancellationToken);

        ApiResponse<OrganizationResponse> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
