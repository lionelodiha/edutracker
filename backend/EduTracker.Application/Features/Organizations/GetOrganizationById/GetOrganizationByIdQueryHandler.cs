using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Organizations.GetOrganizationById;

internal sealed class GetOrganizationByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetOrganizationByIdQuery, OperationResult<OrganizationResponse>>
{
    public async Task<OperationResult<OrganizationResponse>> Handle(GetOrganizationByIdQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool isMember = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                m => m.OrganizationId == message.OrganizationId
                    && m.UserId == message.UserId.Value
                    && m.Status == OrganizationMemberStatus.Active,
                cancellationToken
            );

        if (!isMember)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        string cacheKey = CacheKeys.OrganizationById(message.OrganizationId);
        OrganizationResponse? cachedOrganization = await cacheService.GetAsync<OrganizationResponse>(cacheKey);

        if (cachedOrganization is not null)
            return ResponseCatalog.Organization.Retrieved
                .As<OrganizationResponse>()
                .WithData(cachedOrganization)
                .ToOperationResult();

        Organization organization = await db.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        OrganizationResponse response = organization.ToOrganizationResponse();

        await cacheService.SetAsync(
            cacheKey,
            response,
            cacheTtlOptions.Value.OrganizationById.Ttl
        );

        return ResponseCatalog.Organization.Retrieved
            .As<OrganizationResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
