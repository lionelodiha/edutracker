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

namespace EduTracker.Application.Features.Courses.CreateCourse;

internal sealed class CreateCourseCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateCourseCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateCourseCommand message, CancellationToken cancellationToken = default)
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

        bool exists = await db.Courses
            .AsNoTracking()
            .AnyAsync(
                course => course.OrganizationId == message.OrganizationId
                    && course.Code == message.Code.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Course.AlreadyExists.ToException();

        Course course = new(message.OrganizationId, message.Name, message.Code);

        db.Courses.Add(course);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.Courses(message.OrganizationId));

        return ResponseCatalog.Course.Created
            .As<Guid>()
            .WithData(course.Id)
            .ToOperationResult();
    }
}
