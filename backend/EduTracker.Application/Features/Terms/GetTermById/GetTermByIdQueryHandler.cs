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

namespace EduTracker.Application.Features.Terms.GetTermById;

internal sealed class GetTermByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetTermByIdQuery, OperationResult<TermResponse>>
{
    public async Task<OperationResult<TermResponse>> Handle(GetTermByIdQuery message, CancellationToken cancellationToken = default)
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

        string cacheKey = CacheKeys.TermById(message.TermId);
        TermResponse? cachedTerm = await cacheService.GetAsync<TermResponse>(cacheKey);

        if (cachedTerm is not null && cachedTerm.OrganizationId == message.OrganizationId)
        {
            return ResponseCatalog.Term.Retrieved
                .As<TermResponse>()
                .WithData(cachedTerm)
                .ToOperationResult();
        }

        TermResponse term = await db.Terms
            .AsNoTracking()
            .Where(item => item.Id == message.TermId && item.Semester.OrganizationId == message.OrganizationId)
            .Select(item => new TermResponse(
                item.Id,
                item.SemesterId,
                item.Ordinal,
                item.Semester.StartYear,
                item.Semester.OrganizationId,
                item.CreatedAt
            ))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Term.NotFound.ToException();

        await cacheService.SetAsync(cacheKey, term, cacheTtlOptions.Value.TermById.Ttl);

        return ResponseCatalog.Term.Retrieved
            .As<TermResponse>()
            .WithData(term)
            .ToOperationResult();
    }
}
