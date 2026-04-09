using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.DeleteClass;

internal sealed class DeleteClassCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteClassCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteClassCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        var academicClass = await db.Classes
            .FirstOrDefaultAsync(
                item => item.Id == message.ClassId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        bool hasAssignedStudents = await db.Students
            .AsNoTracking()
            .AnyAsync(item => item.ClassId == academicClass.Id, cancellationToken);

        if (hasAssignedStudents)
            throw ResponseCatalog.Class.HasAssignedStudents.ToException();

        db.Classes.Remove(academicClass);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.ClassById(academicClass.Id));
        await cacheService.RemoveAsync(CacheKeys.Classes(message.OrganizationId));

        return ResponseCatalog.Class.Deleted.ToOperationResult();
    }
}
