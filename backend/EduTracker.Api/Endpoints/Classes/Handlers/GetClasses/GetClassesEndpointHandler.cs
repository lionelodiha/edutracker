using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.GetClasses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Endpoints.Classes.Handlers.GetClasses;

internal static class GetClassesEndpointHandler
{
    public static async Task<IResult> Handle(
        HttpContext httpContext,
        Guid organizationId,
        IMediator mediator,
        CancellationToken cancellationToken = default
    )
    {
        Guid? actorId = httpContext.User.GetUserId();
        OperationResult<IReadOnlyList<ClassResponse>> result = await mediator.Send(
            new GetClassesQuery(actorId, organizationId),
            cancellationToken
        );

        ApiResponse<IReadOnlyList<ClassResponse>> response = result.ToApiResponse();
        return Results.Ok(response);
    }
}
