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

namespace EduTracker.Application.Features.Users.GetUserById;

public class GetUserByIdHandler(AppDbContext db, IDataEncryptionService encryptionService)
    : IHandler<GetUserByIdRequest, OperationResult<UserResponse>>
{
    public async Task<OperationResult<UserResponse>> Handle(GetUserByIdRequest message, CancellationToken cancellationToken = default)
    {
        User? user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == message.Id, cancellationToken)
            ?? throw ResponseCatalog.User.UserNotFound.ToException();

        UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
            encryptionService.Decrypt(user.EncryptedData, CryptoPurpose.UserSensitiveData)
        );

        user.SetSensitiveData(sensitiveData);

        return ResponseCatalog.User.UserRetrieved
            .As<UserResponse>()
            .WithData(user.ToUserResponse())
            .ToOperationResult();
    }
}
