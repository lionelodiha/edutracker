using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Departments.CreateDepartment;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Departments.Handlers.CreateDepartment;

internal static class CreateDepartmentEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        [FromBody] CreateDepartmentRequest request,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();

        var result = await mediator.Send(
            new CreateDepartmentCommand(actorId, request.OrganizationId, request.FacultyId, request.Name, request.Description),
            cancellationToken
        );

        return Results.Created($"/api/departments/{result.Data}", result.ToApiResponse());
    }
}
