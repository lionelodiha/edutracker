using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Academics;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Semesters.DeleteSemester;

internal sealed class DeleteSemesterCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteSemesterCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteSemesterCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        Semester semester = await db.Semesters
            .FirstOrDefaultAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Semester.NotFound.ToException();

        db.Semesters.Remove(semester);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.SemesterById(semester.Id));
        await cacheService.RemoveAsync(CacheKeys.Semesters(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semester.Id));

        return ResponseCatalog.Semester.Deleted.ToOperationResult();
    }
}
