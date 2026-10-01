using EduTracker.Api.Extensions.Claims;
using EduTracker.Api.Extensions.Endpoints;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.CreateClass;
using EduTracker.Application.Features.Classes.DeleteClass;
using EduTracker.Application.Features.Classes.GetClassesByOffering;
using EduTracker.Application.Features.Classes.Models;
using Microsoft.AspNetCore.Mvc;

namespace EduTracker.Api.Endpoints.Classes;

internal sealed class ClassEndpoints : IEndpointModule
{
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        RouteGroupBuilder group = app.MapGroup("/api/classes")
            .WithTags("Classes")
            .RequireAuthorization();

        group.MapPost("/", async ([FromBody] CreateClassRequest request, HttpContext context, IMediator mediator) =>
        {
            CreateClassCommand command = new(
                context.User.GetUserId(),
                request.OrganizationId,
                request.CourseOfferingId,
                request.Code,
                request.InstructorId,
                request.MaxCapacity
            );
            var result = await mediator.Send(command);
            return Results.Created($"/api/classes/{result.Data}", result.ToApiResponse());
        })
        .Produces<ApiResponse<Guid>>(StatusCodes.Status201Created)
        .Produces<ApiResponse<object>>(StatusCodes.Status400BadRequest)
        .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
        .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
        .Produces<ApiResponse<object>>(StatusCodes.Status409Conflict);

        group.MapGet("/offering/{courseOfferingId:guid}", async (Guid courseOfferingId, [AsParameters] GetClassesRequest request, IMediator mediator) =>
        {
            GetClassesByOfferingQuery query = new(request.OrganizationId, courseOfferingId);
            var result = await mediator.Send(query);
            return Results.Ok(result.ToApiResponse());
        })
        .Produces<ApiResponse<IReadOnlyList<ClassResponse>>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
        .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden);

        group.MapDelete("/{id:guid}", async (Guid id, [AsParameters] DeleteClassRequest request, HttpContext context, IMediator mediator) =>
        {
            DeleteClassCommand command = new(
                context.User.GetUserId(),
                request.OrganizationId,
                id
            );
            var result = await mediator.Send(command);
            return Results.Ok(result.ToApiResponse());
        })
        .Produces<ApiResponse<object>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<object>>(StatusCodes.Status401Unauthorized)
        .Produces<ApiResponse<object>>(StatusCodes.Status403Forbidden)
        .Produces<ApiResponse<object>>(StatusCodes.Status404NotFound);
    }
}

internal sealed class CreateClassRequest
{
    public Guid OrganizationId { get; init; }
    public Guid CourseOfferingId { get; init; }
    public string Code { get; init; } = string.Empty;
    public Guid? InstructorId { get; init; }
    public int MaxCapacity { get; init; }
}

internal sealed class GetClassesRequest
{
    public Guid OrganizationId { get; init; }
}

internal sealed class DeleteClassRequest
{
    public Guid OrganizationId { get; init; }
}
