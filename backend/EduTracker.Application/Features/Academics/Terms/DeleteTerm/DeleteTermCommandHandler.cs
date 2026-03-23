using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Terms.DeleteTerm;

internal sealed class DeleteTermCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteTermCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteTermCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        Term term = await db.Terms
            .FirstOrDefaultAsync(
                item => item.Id == message.TermId && item.Semester.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Term.NotFound.ToException();

        Guid semesterId = term.SemesterId;

        db.Terms.Remove(term);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.TermById(message.TermId));
        await cacheService.RemoveAsync(CacheKeys.TermsBySemester(semesterId));
        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semesterId));

        return ResponseCatalog.Term.Deleted.ToOperationResult();
    }
}
