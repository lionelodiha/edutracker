using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Organizations.GetOrganizationMembers;

internal sealed class GetOrganizationMembersQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetOrganizationMembersQuery, OperationResult<IReadOnlyList<OrganizationMemberResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<OrganizationMemberResponse>>> Handle(GetOrganizationMembersQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status is not OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        string cacheKey = CacheKeys.OrganizationMembers(message.OrganizationId);
        List<OrganizationMemberResponse>? cachedMembers = await cacheService.GetAsync<List<OrganizationMemberResponse>>(cacheKey);

        if (cachedMembers is not null)
            return ResponseCatalog.Organization.MembersRetrieved
                .As<IReadOnlyList<OrganizationMemberResponse>>()
                .WithData(cachedMembers)
                .ToOperationResult();

        List<(OrganizationMember Member, User User)> memberEntries = await db.OrganizationMembers
            .AsNoTracking()
            .Where(m => m.OrganizationId == message.OrganizationId)
            .Join(
                db.Users.AsNoTracking(),
                member => member.UserId,
                user => user.Id,
                (member, user) => new ValueTuple<OrganizationMember, User>(member, user)
            )
            .ToListAsync(cancellationToken);

        List<OrganizationMemberResponse> members = new(memberEntries.Count);

        foreach ((OrganizationMember member, User user) in memberEntries)
        {
            UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
                encryptionService.Decrypt(user.EncryptedData, CryptoPurpose.UserSensitiveData)
            );

            members.Add(new OrganizationMemberResponse(
                member.Id,
                member.UserId,
                user.UserName,
                sensitiveData.FirstName,
                sensitiveData.LastName,
                member.Role,
                member.Status,
                member.CreatedAt
            ));
        }

        await cacheService.SetAsync(
            cacheKey,
            members,
            cacheTtlOptions.Value.OrganizationMembers.Ttl
        );

        return ResponseCatalog.Organization.MembersRetrieved
            .As<IReadOnlyList<OrganizationMemberResponse>>()
            .WithData(members)
            .ToOperationResult();
    }
}
