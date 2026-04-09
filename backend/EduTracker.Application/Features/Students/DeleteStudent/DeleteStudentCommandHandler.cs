using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Students.DeleteStudent;

internal sealed class DeleteStudentCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteStudentCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteStudentCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        var student = await db.Students
            .FirstOrDefaultAsync(
                item => item.Id == message.StudentId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Student.NotFound.ToException();

        db.Students.Remove(student);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.StudentById(student.Id));
        await cacheService.RemoveAsync(CacheKeys.Students(message.OrganizationId));
        if (student.ClassId.HasValue)
            await cacheService.RemoveAsync(CacheKeys.ClassById(student.ClassId.Value));

        return ResponseCatalog.Student.Deleted.ToOperationResult();
    }
}
