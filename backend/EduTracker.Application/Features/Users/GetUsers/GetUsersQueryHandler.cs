using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Users.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Users.GetUsers;

internal sealed class GetUsersQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetUsersQuery, OperationResult<CursorPage<UserResponse>>>
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<OperationResult<CursorPage<UserResponse>>> Handle(GetUsersQuery message, CancellationToken cancellationToken = default)
    {
        int pageSize = Math.Clamp(message.Limit ?? DefaultPageSize, 1, MaxPageSize);

        IQueryable<User> query = db.Users.AsNoTracking();

        if (message.Id.HasValue)
            query = query.Where(u => u.Id == message.Id.Value);

        if (!string.IsNullOrWhiteSpace(message.UserName))
        {
            string userName = message.UserName.Trim().ToUpperInvariant();

            query = query.Where(u =>
                u.UserName != null &&
                u.UserName.ToUpper().Contains(userName)
            );
        }

        if (message.Cursor.HasValue)
            query = query.Where(u => u.Id > message.Cursor.Value);

        List<User> usersPage = await query
            .OrderBy(u => u.Id)
            .Take(pageSize + 1)
            .ToListAsync(cancellationToken);

        bool hasMore = usersPage.Count > pageSize;

        if (hasMore)
            usersPage = [.. usersPage.Take(pageSize)];

        List<UserResponse> responses = new(usersPage.Count);
        List<Guid> missingIds = [];

        foreach (User user in usersPage)
        {
            UserResponse? cachedResponse = await cacheService.GetAsync<UserResponse>(
                CacheKeys.UserProfileById(user.Id)
            );

            if (cachedResponse is not null)
            {
                responses.Add(cachedResponse);
            }
            else
            {
                missingIds.Add(user.Id);
            }
        }

        if (missingIds.Count > 0)
        {
            List<User> missingUsers = [.. usersPage.Where(u => missingIds.Contains(u.Id))];

            foreach (User user in missingUsers)
            {
                UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
                    encryptionService.Decrypt(user.EncryptedData, CryptoPurpose.UserSensitiveData)
                );

                user.SetSensitiveData(sensitiveData);

                UserResponse response = user.ToUserResponse();

                await cacheService.SetAsync(
                    CacheKeys.UserProfileById(user.Id),
                    response,
                    cacheTtlOptions.Value.UserProfileById.Ttl
                );

                responses.Add(response);
            }
        }

        responses = [.. responses.OrderBy(r => r.Id)];

        Guid? nextCursor = hasMore && responses.Count > 0 ? responses[^1].Id : null;

        CursorPage<UserResponse> page = new(
            Items: responses,
            NextCursor: nextCursor,
            HasMore: hasMore
        );

        return ResponseCatalog.User.Retrieved
            .As<CursorPage<UserResponse>>()
            .WithData(page)
            .ToOperationResult();
    }
}
