using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Academics;
using EduTracker.Application.Features.Academics.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Academics.CourseOfferings.GetCourseOfferingsBySemester;

internal sealed class GetCourseOfferingsBySemesterQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetCourseOfferingsBySemesterQuery, OperationResult<IReadOnlyList<CourseOfferingResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<CourseOfferingResponse>>> Handle(
        GetCourseOfferingsBySemesterQuery message,
        CancellationToken cancellationToken = default
    )
    {
        await AcademicAccessGuard.EnsureActiveMember(db, message.OrganizationId, message.UserId, cancellationToken);

        bool semesterExists = await db.Semesters
            .AsNoTracking()
            .AnyAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            );

        if (!semesterExists)
            throw ResponseCatalog.Semester.NotFound.ToException();

        string cacheKey = CacheKeys.CourseOfferingsBySemester(message.SemesterId);
        IReadOnlyList<CourseOfferingResponse>? cachedItems =
            await cacheService.GetAsync<IReadOnlyList<CourseOfferingResponse>>(cacheKey);

        if (cachedItems is not null)
        {
            return ResponseCatalog.CourseOffering.Retrieved
                .As<IReadOnlyList<CourseOfferingResponse>>()
                .WithData(cachedItems)
                .ToOperationResult();
        }

        List<CourseOfferingResponse> offerings = await db.CourseOfferings
            .AsNoTracking()
            .Where(item => item.SemesterId == message.SemesterId && item.OrganizationId == message.OrganizationId)
            .OrderBy(item => item.Course.Code)
            .Select(item => new CourseOfferingResponse(
                item.Id,
                item.CourseId,
                item.Course.Name,
                item.Course.Code,
                item.SemesterId,
                item.Semester.Session,
                item.OrganizationId,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        await cacheService.SetAsync(
            cacheKey,
            offerings,
            cacheTtlOptions.Value.CourseOfferingsBySemester.Ttl
        );

        return ResponseCatalog.CourseOffering.Retrieved
            .As<IReadOnlyList<CourseOfferingResponse>>()
            .WithData(offerings)
            .ToOperationResult();
    }
}
