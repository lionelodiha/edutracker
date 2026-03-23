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

namespace EduTracker.Application.Features.CourseOfferings.GetCourseOfferingsBySemester;

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
            .Where(item => item.Term.SemesterId == message.SemesterId && item.Term.Semester.OrganizationId == message.OrganizationId)
            .OrderBy(item => item.Term.Ordinal)
            .ThenBy(item => item.Course.Code)
            .Select(item => new CourseOfferingResponse(
                item.Id,
                item.CourseId,
                item.Course.Name,
                item.Course.Code,
                item.Term.SemesterId,
                item.TermId,
                item.Term.Ordinal,
                item.Term.Semester.StartYear,
                item.Term.Semester.OrganizationId,
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
