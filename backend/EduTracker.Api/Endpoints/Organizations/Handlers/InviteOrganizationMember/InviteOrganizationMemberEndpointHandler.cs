using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.InviteOrganizationMember;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.InviteOrganizationMember;

internal static class InviteOrganizationMemberEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] InviteOrganizationMemberRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        InviteOrganizationMemberCommand command = new(
            ActorId: actorId,
            OrganizationId: id,
            UserId: request.UserId,
            Role: request.Role
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Ok(response);
    }
}
