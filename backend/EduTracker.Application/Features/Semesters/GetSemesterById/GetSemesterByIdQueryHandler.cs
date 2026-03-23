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

namespace EduTracker.Application.Features.Semesters.GetSemesterById;

internal sealed class GetSemesterByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions
) : IHandler<GetSemesterByIdQuery, OperationResult<SemesterResponse>>
{
    public async Task<OperationResult<SemesterResponse>> Handle(GetSemesterByIdQuery message, CancellationToken cancellationToken = default)
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

        string cacheKey = CacheKeys.SemesterById(message.SemesterId);
        SemesterResponse? cachedSemester = await cacheService.GetAsync<SemesterResponse>(cacheKey);

        if (cachedSemester is not null && cachedSemester.OrganizationId == message.OrganizationId)
        {
            return ResponseCatalog.Semester.Retrieved
                .As<SemesterResponse>()
                .WithData(cachedSemester)
                .ToOperationResult();
        }

        Semester semester = await db.Semesters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == message.SemesterId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Semester.NotFound.ToException();

        SemesterResponse response = semester.ToSemesterResponse();

        await cacheService.SetAsync(cacheKey, response, cacheTtlOptions.Value.SemesterById.Ttl);

        return ResponseCatalog.Semester.Retrieved
            .As<SemesterResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
