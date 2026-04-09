using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Classes.GetClasses;

internal sealed class GetClassesQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetClassesQuery, OperationResult<IReadOnlyList<ClassResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<ClassResponse>>> Handle(GetClassesQuery message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorIsActiveMemberAsync(db, message.UserId, message.OrganizationId, cancellationToken);

        string cacheKey = CacheKeys.Classes(message.OrganizationId);
        IReadOnlyList<ClassResponse>? cachedClasses = await cacheService.GetAsync<IReadOnlyList<ClassResponse>>(cacheKey);

        if (cachedClasses is not null)
        {
            return ResponseCatalog.Class.Retrieved
                .As<IReadOnlyList<ClassResponse>>()
                .WithData(cachedClasses)
                .ToOperationResult();
        }

        List<ClassResponse> classes = await db.Classes
            .AsNoTracking()
            .Where(item => item.OrganizationId == message.OrganizationId)
            .OrderBy(item => item.Name)
            .Select(item => new ClassResponse(
                item.Id,
                item.Name,
                item.Code,
                item.OrganizationId,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        await cacheService.SetAsync(cacheKey, classes, cacheTtlOptions.Value.Classes.Ttl);

        return ResponseCatalog.Class.Retrieved
            .As<IReadOnlyList<ClassResponse>>()
            .WithData(classes)
            .ToOperationResult();
    }
}
