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

namespace EduTracker.Application.Features.Users.GetUserById;

internal sealed class GetUserByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetUserByIdQuery, OperationResult<UserResponse>>
{
    public async Task<OperationResult<UserResponse>> Handle(GetUserByIdQuery message, CancellationToken cancellationToken = default)
    {
        if (message.Id is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        UserResponse? cachedUserProfile = await cacheService.GetAsync<UserResponse>(
            CacheKeys.UserProfileById(message.Id.Value)
        );

        if (cachedUserProfile is not null)
            return ResponseCatalog.User.Retrieved
                .As<UserResponse>()
                .WithData(cachedUserProfile)
                .ToOperationResult();

        User user = await db.Users.FirstOrDefaultAsync(u => u.Id == message.Id.Value, cancellationToken)
            ?? throw ResponseCatalog.User.NotFound.ToException();

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

        return ResponseCatalog.User.Retrieved
            .As<UserResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
