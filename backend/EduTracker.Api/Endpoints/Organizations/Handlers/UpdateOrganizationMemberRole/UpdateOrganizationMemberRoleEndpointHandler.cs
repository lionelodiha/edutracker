using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.UpdateOrganizationMemberRole;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Organizations.Handlers.UpdateOrganizationMemberRole;

internal static class UpdateOrganizationMemberRoleEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        Guid memberId,
        [FromBody] UpdateOrganizationMemberRoleRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        UpdateOrganizationMemberRoleCommand command = new(
            ActorId: actorId,
            OrganizationId: id,
            MemberId: memberId,
            RoleKey: request.RoleKey
        );

        OperationResult<object> result = await mediator.Send(command, cancellationToken);

        ApiResponse<object> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
