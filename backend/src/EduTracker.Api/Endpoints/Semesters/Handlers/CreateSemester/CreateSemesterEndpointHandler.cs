using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Semesters.CreateSemester;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Semesters.Handlers.CreateSemester;

internal static class CreateSemesterEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateSemesterRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        var result = await mediator.Send(
            new CreateSemesterCommand(actorId, request.OrganizationId, request.StartYear),
            cancellationToken
        );

        return Results.Created($"/api/semesters/{result.Data}", result.ToApiResponse());
    }
}
