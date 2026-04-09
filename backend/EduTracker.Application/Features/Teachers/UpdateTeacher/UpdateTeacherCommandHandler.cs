using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Teachers.UpdateTeacher;

internal sealed class UpdateTeacherCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateTeacherCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateTeacherCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        var teacher = await db.Teachers
            .FirstOrDefaultAsync(
                item => item.Id == message.TeacherId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Teacher.NotFound.ToException();

        bool exists = await db.Teachers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.Id != message.TeacherId
                    && item.StaffId == message.StaffId.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Teacher.AlreadyExists.ToException();

        teacher.UpdateStaffId(message.StaffId);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.TeacherById(teacher.Id));
        await cacheService.RemoveAsync(CacheKeys.Teachers(message.OrganizationId));

        return ResponseCatalog.Teacher.Updated.ToOperationResult();
    }
}
