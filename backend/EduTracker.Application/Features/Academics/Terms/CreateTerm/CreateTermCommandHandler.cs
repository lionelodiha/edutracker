using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Terms.CreateTerm;

internal sealed class CreateTermCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateTermCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateTermCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        bool semesterExists = await db.Semesters
            .AsNoTracking()
            .AnyAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            );

        if (!semesterExists)
            throw ResponseCatalog.Semester.NotFound.ToException();

        bool exists = await db.Terms
            .AsNoTracking()
            .AnyAsync(
                item => item.SemesterId == message.SemesterId && item.Ordinal == message.Ordinal,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Term.AlreadyExists.ToException();

        Term term = new(message.SemesterId, message.Ordinal);

        db.Terms.Add(term);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.TermsBySemester(message.SemesterId));
        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(message.SemesterId));

        return ResponseCatalog.Term.Created
            .As<Guid>()
            .WithData(term.Id)
            .ToOperationResult();
    }
}
