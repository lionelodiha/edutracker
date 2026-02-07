using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Classes.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.GetClassById;

public sealed class GetClassByIdQueryHandler(
    AppDbContext db
) : IHandler<GetClassByIdQuery, OperationResult<ClassResponse>>
{
    public async Task<OperationResult<ClassResponse>> Handle(GetClassByIdQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var classEntity = await db.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == message.ClassId, cancellationToken)
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == classEntity.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        return ResponseCatalog.Class.Retrieved
            .As<ClassResponse>()
            .WithData(classEntity.ToClassResponse())
            .ToOperationResult();
    }
}
