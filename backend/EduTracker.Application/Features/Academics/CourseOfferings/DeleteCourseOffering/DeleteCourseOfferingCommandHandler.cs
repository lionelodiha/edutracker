using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.CourseOfferings.DeleteCourseOffering;

internal sealed class DeleteCourseOfferingCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteCourseOfferingCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteCourseOfferingCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        CourseOffering offering = await db.CourseOfferings
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseOfferingId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.CourseOffering.NotFound.ToException();

        db.CourseOfferings.Remove(offering);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(offering.SemesterId));

        return ResponseCatalog.CourseOffering.Deleted.ToOperationResult();
    }
}
