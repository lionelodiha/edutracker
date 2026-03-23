using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Academics.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Academics.Semesters.GetSemesters;

internal sealed class GetSemestersQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetSemestersQuery, OperationResult<IReadOnlyList<SemesterResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<SemesterResponse>>> Handle(GetSemestersQuery message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureActiveMember(db, message.OrganizationId, message.UserId, cancellationToken);

        string cacheKey = CacheKeys.Semesters(message.OrganizationId);
        IReadOnlyList<SemesterResponse>? cachedSemesters = await cacheService.GetAsync<IReadOnlyList<SemesterResponse>>(cacheKey);

        if (cachedSemesters is not null)
        {
            return ResponseCatalog.Semester.Retrieved
                .As<IReadOnlyList<SemesterResponse>>()
                .WithData(cachedSemesters)
                .ToOperationResult();
        }

        List<SemesterResponse> semesters = await db.Semesters
            .AsNoTracking()
            .Where(item => item.OrganizationId == message.OrganizationId)
            .OrderByDescending(item => item.StartYear)
            .Select(item => new SemesterResponse(
                item.Id,
                item.StartYear,
                item.OrganizationId,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        await cacheService.SetAsync(cacheKey, semesters, cacheTtlOptions.Value.Semesters.Ttl);

        return ResponseCatalog.Semester.Retrieved
            .As<IReadOnlyList<SemesterResponse>>()
            .WithData(semesters)
            .ToOperationResult();
    }
}
