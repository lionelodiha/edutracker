using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using EduTracker.Application.Services;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.CreateClass;

internal sealed class CreateClassCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateClassCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateClassCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        bool exists = await db.Classes
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.Code == message.Code.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Class.AlreadyExists.ToException();

        AcademicClass academicClass = new(message.OrganizationId, message.Name, message.Code);

        db.Classes.Add(academicClass);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.Classes(message.OrganizationId));

        return ResponseCatalog.Class.Created
            .As<Guid>()
            .WithData(academicClass.Id)
            .ToOperationResult();
    }
}
