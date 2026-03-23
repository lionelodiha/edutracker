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

namespace EduTracker.Application.Features.Semesters.DeleteSemester;

internal sealed class DeleteSemesterCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteSemesterCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteSemesterCommand message, CancellationToken cancellationToken = default)
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

        Semester semester = await db.Semesters
            .FirstOrDefaultAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Semester.NotFound.ToException();

        db.Semesters.Remove(semester);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.SemesterById(semester.Id));
        await cacheService.RemoveAsync(CacheKeys.Semesters(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.TermsBySemester(semester.Id));
        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semester.Id));

        return ResponseCatalog.Semester.Deleted.ToOperationResult();
    }
}
