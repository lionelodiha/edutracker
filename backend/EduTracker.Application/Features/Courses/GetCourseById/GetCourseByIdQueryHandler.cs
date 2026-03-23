using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Courses.GetCourseById;

internal sealed class GetCourseByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetCourseByIdQuery, OperationResult<CourseResponse>>
{
    public async Task<OperationResult<CourseResponse>> Handle(GetCourseByIdQuery message, CancellationToken cancellationToken = default)
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

        string cacheKey = CacheKeys.CourseById(message.CourseId);
        CourseResponse? cachedCourse = await cacheService.GetAsync<CourseResponse>(cacheKey);

        if (cachedCourse is not null && cachedCourse.OrganizationId == message.OrganizationId)
        {
            return ResponseCatalog.Course.Retrieved
                .As<CourseResponse>()
                .WithData(cachedCourse)
                .ToOperationResult();
        }

        Course course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        CourseResponse response = course.ToCourseResponse();

        await cacheService.SetAsync(cacheKey, response, cacheTtlOptions.Value.CourseById.Ttl);

        return ResponseCatalog.Course.Retrieved
            .As<CourseResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
