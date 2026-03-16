using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.UpdateOrganization;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganization;

internal static class UpdateOrganizationEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] UpdateOrganizationRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        UpdateOrganizationCommand command = new(actorId, id, request.Name);
        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
