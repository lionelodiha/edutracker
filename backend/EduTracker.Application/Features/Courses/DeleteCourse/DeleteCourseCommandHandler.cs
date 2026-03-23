using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Courses.DeleteCourse;

internal sealed class DeleteCourseCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteCourseCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteCourseCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var organizationState = await db.Organizations
            .AsNoTracking()
            .Where(item => item.Id == message.OrganizationId)
            .Select(item => new { item.IsLocked })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organizationState.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();

        bool canManage = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.UserId == message.ActorId.Value
                    && item.Status == OrganizationMemberStatus.Active
                    && (item.Role == OrganizationMemberRole.Owner || item.Role == OrganizationMemberRole.Moderator),
                cancellationToken
            );

        if (!canManage)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        Course course = await db.Courses
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        List<Guid> semesterIds = await db.CourseOfferings
            .AsNoTracking()
            .Where(item => item.CourseId == course.Id)
            .Select(item => item.Term.SemesterId)
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
