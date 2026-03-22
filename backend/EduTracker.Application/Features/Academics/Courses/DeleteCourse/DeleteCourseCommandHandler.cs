using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Courses.DeleteCourse;

internal sealed class DeleteCourseCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteCourseCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteCourseCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        Course course = await db.Courses
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        List<Guid> semesterIds = await db.CourseOfferings
            .AsNoTracking()
            .Where(item => item.CourseId == course.Id)
            .Select(item => item.SemesterId)
            .Distinct()
            .ToListAsync(cancellationToken);

        db.Courses.Remove(course);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.CourseById(course.Id));
        await cacheService.RemoveAsync(CacheKeys.Courses(message.OrganizationId));

        foreach (Guid semesterId in semesterIds)
            await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semesterId));

        return ResponseCatalog.Course.Deleted.ToOperationResult();
    }
}
