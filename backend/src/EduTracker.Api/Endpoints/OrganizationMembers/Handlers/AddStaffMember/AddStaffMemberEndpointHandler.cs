using EduTracker.Api.Constants.Routes;
using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationMembers.AddStaffMember;
using EduTracker.Application.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.OrganizationMembers.Handlers.AddStaffMember;

// TEMPORARY — see AddStaffMemberCommand.cs for context.
internal static class AddStaffMemberEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid id,
        [FromBody] AddStaffMemberRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        AddStaffMemberCommand command = new(
            ActorId: actorId,
            OrganizationId: id,
            FirstName: request.FirstName,
            MiddleName: request.MiddleName,
            LastName: request.LastName,
            UserName: request.UserName,
            Email: request.Email,
            Password: request.Password,
            Role: request.Role
        );

        OperationResult<Guid> result = await mediator.Send(command, cancellationToken);

        Guid userId = result.Data;
        string location = $"{ApiRoutes.User.Base}/{userId}";

        ApiResponse<object> response = result.WithoutData().ToApiResponse();
        return Results.Created(location, response);
    }
}
