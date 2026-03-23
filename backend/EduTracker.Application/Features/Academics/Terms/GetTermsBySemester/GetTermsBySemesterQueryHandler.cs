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

namespace EduTracker.Application.Features.Academics.Terms.GetTermsBySemester;

internal sealed class GetTermsBySemesterQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetTermsBySemesterQuery, OperationResult<IReadOnlyList<TermResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<TermResponse>>> Handle(
        GetTermsBySemesterQuery message,
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

        string cacheKey = CacheKeys.TermsBySemester(message.SemesterId);
        IReadOnlyList<TermResponse>? cachedTerms = await cacheService.GetAsync<IReadOnlyList<TermResponse>>(cacheKey);

        if (cachedTerms is not null)
        {
            return ResponseCatalog.Term.Retrieved
                .As<IReadOnlyList<TermResponse>>()
                .WithData(cachedTerms)
                .ToOperationResult();
        }

        List<TermResponse> terms = await db.Terms
            .AsNoTracking()
            .Where(item => item.SemesterId == message.SemesterId && item.Semester.OrganizationId == message.OrganizationId)
            .OrderBy(item => item.Ordinal)
            .Select(item => new TermResponse(
                item.Id,
                item.SemesterId,
                item.Ordinal,
                item.Semester.StartYear,
                item.Semester.OrganizationId,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        await cacheService.SetAsync(cacheKey, terms, cacheTtlOptions.Value.TermsBySemester.Ttl);

        return ResponseCatalog.Term.Retrieved
            .As<IReadOnlyList<TermResponse>>()
            .WithData(terms)
            .ToOperationResult();
    }
}
