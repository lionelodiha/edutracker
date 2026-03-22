using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Semesters.UpdateSemester;

internal sealed class UpdateSemesterCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateSemesterCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateSemesterCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        Semester semester = await db.Semesters
            .FirstOrDefaultAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Semester.NotFound.ToException();

        bool exists = await db.Semesters
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.Id != message.SemesterId
                    && item.Session == message.Session.Trim(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Semester.AlreadyExists.ToException();

        semester.UpdateSession(message.Session);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.SemesterById(semester.Id));
        await cacheService.RemoveAsync(CacheKeys.Semesters(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semester.Id));

        return ResponseCatalog.Semester.Updated.ToOperationResult();
    }
}
