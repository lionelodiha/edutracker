using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.CreateOrganization;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.CreateOrganization;

internal static class CreateOrganizationEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateOrganizationRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? userId = httpContext.User.GetUserId();

        CreateOrganizationCommand command = new(
            OwnerUserId: userId,
            Name: request.Name
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        Guid orgId = result.Data;
        string location = $"{ApiRoutes.Organization.Base}/{orgId}";

        ApiResponse<object> response = result.WithoutData().ToApiResponse();

        return Results.Created(location, response);
    }
}
