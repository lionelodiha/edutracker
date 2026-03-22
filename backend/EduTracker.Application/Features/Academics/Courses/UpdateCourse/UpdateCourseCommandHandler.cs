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

namespace EduTracker.Application.Features.Academics.Courses.UpdateCourse;

internal sealed class UpdateCourseCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateCourseCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateCourseCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        Course course = await db.Courses
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        bool exists = await db.Courses
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.Id != message.CourseId
                    && item.Code == message.Code.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Course.AlreadyExists.ToException();

        course.UpdateDetails(message.Name, message.Code);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.CourseById(course.Id));
        await cacheService.RemoveAsync(CacheKeys.Courses(message.OrganizationId));

        List<Guid> semesterIds = await db.CourseOfferings
            .AsNoTracking()
            .Where(item => item.CourseId == course.Id)
            .Select(item => item.SemesterId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (Guid semesterId in semesterIds)
            await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semesterId));

        return ResponseCatalog.Course.Updated.ToOperationResult();
    }
}
