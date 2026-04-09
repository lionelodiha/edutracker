using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Classes.GetClassById;

internal sealed class GetClassByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetClassByIdQuery, OperationResult<ClassResponse>>
{
    public async Task<OperationResult<ClassResponse>> Handle(GetClassByIdQuery message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorIsActiveMemberAsync(db, message.UserId, message.OrganizationId, cancellationToken);

        string cacheKey = CacheKeys.ClassById(message.ClassId);
        ClassResponse? cachedClass = await cacheService.GetAsync<ClassResponse>(cacheKey);

        if (cachedClass is not null && cachedClass.OrganizationId == message.OrganizationId)
        {
            return ResponseCatalog.Class.Retrieved
                .As<ClassResponse>()
                .WithData(cachedClass)
                .ToOperationResult();
        }

        var academicClass = await db.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == message.ClassId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        ClassResponse response = academicClass.ToClassResponse();

        await cacheService.SetAsync(cacheKey, response, cacheTtlOptions.Value.ClassById.Ttl);

        return ResponseCatalog.Class.Retrieved
            .As<ClassResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
