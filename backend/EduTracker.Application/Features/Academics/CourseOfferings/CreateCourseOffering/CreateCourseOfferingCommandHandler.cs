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

        Semester semester = await db.Semesters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Semester.NotFound.ToException();

        if (course.OrganizationId != semester.OrganizationId)
            throw ResponseCatalog.CourseOffering.OrganizationMismatch.ToException();

        bool exists = await db.CourseOfferings
            .AsNoTracking()
            .AnyAsync(
                item => item.CourseId == message.CourseId && item.SemesterId == message.SemesterId,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.CourseOffering.AlreadyExists.ToException();

        CourseOffering offering = new(message.SemesterId, message.CourseId, message.OrganizationId);

        db.CourseOfferings.Add(offering);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(message.SemesterId));

        return ResponseCatalog.CourseOffering.Created
            .As<Guid>()
            .WithData(offering.Id)
            .ToOperationResult();
    }
}
