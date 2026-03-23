using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.CourseOfferings.CreateCourseOffering;

internal sealed class CreateCourseOfferingCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateCourseOfferingCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateCourseOfferingCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        Course course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        Term term = await db.Terms
            .AsNoTracking()
            .Include(item => item.Semester)
            .FirstOrDefaultAsync(
                item => item.Id == message.TermId && item.Semester.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Term.NotFound.ToException();

        if (course.OrganizationId != term.Semester.OrganizationId)
            throw ResponseCatalog.CourseOffering.OrganizationMismatch.ToException();

        bool exists = await db.CourseOfferings
            .AsNoTracking()
            .AnyAsync(
                item => item.CourseId == message.CourseId && item.TermId == message.TermId,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.CourseOffering.AlreadyExists.ToException();

        CourseOffering offering = new(term.SemesterId, message.TermId, message.CourseId);

        db.CourseOfferings.Add(offering);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(term.SemesterId));

        return ResponseCatalog.CourseOffering.Created
            .As<Guid>()
            .WithData(offering.Id)
            .ToOperationResult();
    }
}
