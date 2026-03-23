using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Courses.GetCourses;

internal sealed class GetCoursesQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetCoursesQuery, OperationResult<IReadOnlyList<CourseResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<CourseResponse>>> Handle(GetCoursesQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool isActiveMember = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.UserId == message.UserId.Value
                    && item.Status == OrganizationMemberStatus.Active,
                cancellationToken
            );

        if (!isActiveMember)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        string cacheKey = CacheKeys.Courses(message.OrganizationId);
        IReadOnlyList<CourseResponse>? cachedCourses = await cacheService.GetAsync<IReadOnlyList<CourseResponse>>(cacheKey);

        if (cachedCourses is not null)
        {
            return ResponseCatalog.Course.Retrieved
                .As<IReadOnlyList<CourseResponse>>()
                .WithData(cachedCourses)
                .ToOperationResult();
        }

        List<CourseResponse> courses = await db.Courses
            .AsNoTracking()
            .Where(item => item.OrganizationId == message.OrganizationId)
            .OrderBy(item => item.Code)
            .Select(item => new CourseResponse(
                item.Id,
                item.Name,
                item.Code,
                item.OrganizationId,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        await cacheService.SetAsync(cacheKey, courses, cacheTtlOptions.Value.Courses.Ttl);

        return ResponseCatalog.Course.Retrieved
            .As<IReadOnlyList<CourseResponse>>()
            .WithData(courses)
            .ToOperationResult();
    }
}
