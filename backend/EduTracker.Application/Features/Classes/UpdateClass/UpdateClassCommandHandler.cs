using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.UpdateClass;

internal sealed class UpdateClassCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateClassCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateClassCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        var academicClass = await db.Classes
            .FirstOrDefaultAsync(
                item => item.Id == message.ClassId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        bool exists = await db.Classes
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.Id != message.ClassId
                    && item.Code == message.Code.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Class.AlreadyExists.ToException();

        academicClass.UpdateName(message.Name);
        academicClass.UpdateCode(message.Code);

        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.ClassById(academicClass.Id));
        await cacheService.RemoveAsync(CacheKeys.Classes(message.OrganizationId));

        return ResponseCatalog.Class.Updated.ToOperationResult();
    }
}
