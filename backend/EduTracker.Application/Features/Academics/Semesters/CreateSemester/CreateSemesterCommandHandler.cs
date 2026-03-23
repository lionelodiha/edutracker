using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Semesters.CreateSemester;

internal sealed class CreateSemesterCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateSemesterCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateSemesterCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        bool exists = await db.Semesters
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.StartYear == message.StartYear,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Semester.AlreadyExists.ToException();

        Semester semester = new(message.OrganizationId, message.StartYear);

        db.Semesters.Add(semester);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.Semesters(message.OrganizationId));

        return ResponseCatalog.Semester.Created
            .As<Guid>()
            .WithData(semester.Id)
            .ToOperationResult();
    }
}
