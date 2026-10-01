using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.OrganizationMembers.AddStaffMember;

// TEMPORARY — see AddStaffMemberCommand.cs for context.
internal sealed class AddStaffMemberCommandHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IHashingService hashingService,
    IDataEncryptionService encryptionService
) : IHandler<AddStaffMemberCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(AddStaffMemberCommand message, CancellationToken cancellationToken = default)
    {
        // 1. Auth: must be signed in.
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        // 2. Org must exist.
        bool organizationExists = await db.Organizations
            .AnyAsync(o => o.Id == message.OrganizationId, cancellationToken);

        if (!organizationExists)
            throw ResponseCatalog.Organization.NotFound.ToException();

        // 3. Caller must be an active Owner/Moderator of the org.
        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value,
                cancellationToken
            );

        bool isActive = actor?.Status == OrganizationMemberStatus.Active;
        bool isPrivilegedRole = actor?.Role is OrganizationMemberRole.Owner or OrganizationMemberRole.Moderator;

        if (!isActive || !isPrivilegedRole)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        // 4. Role must be one of the staff roles. Cannot provision Owner (ownership is transferred, not granted).
        if (message.Role is OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        // 5. Duplicate email / username guard — same rules as RegisterUser.
        string emailHash = hashingService.HashEmail(message.Email);
        string normalizedUserName = message.UserName.Trim();

        if (await db.Users.AnyAsync(u => u.EmailHash == emailHash, cancellationToken))
            throw ResponseCatalog.Auth.EmailAlreadyExists.ToException();

        if (await db.Users.AnyAsync(u => u.UserName == normalizedUserName, cancellationToken))
            throw ResponseCatalog.User.UserNameExists.ToException();

        // 6. Create the user — mirrors RegisterUserCommandHandler exactly.
        UserSensitive sensitiveData = UserSensitive.Create(
            firstName: message.FirstName,
            middleName: message.MiddleName,
            lastName: message.LastName,
            email: message.Email
        );

        byte[] sensitiveDataBytes = ObjectByteConverter.SerializeToBytes(sensitiveData);
        byte[] encryptedData = encryptionService.Encrypt(sensitiveDataBytes, CryptoPurpose.UserSensitiveData);

        string passwordHash = await hashingService.HashPasswordAsync(message.Password);

        User user = new(
            userName: normalizedUserName,
            emailHash: emailHash,
            passwordHash: passwordHash
        );

        user.SetSensitiveData(sensitiveData);
        user.SetEncryptedData(encryptedData);

        // 7. Create the org membership with the requested role, active from the start.
        OrganizationMember member = new(
            organizationId: message.OrganizationId,
            userId: user.Id
        );

        member.UpdateRole(message.Role);
        member.UpdateStatus(OrganizationMemberStatus.Active);

        // 8. Atomic persistence — if anything fails, neither the user nor the membership is saved.
        await using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction tx =
            await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            db.Users.Add(user);
            db.OrganizationMembers.Add(member);
            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        // 9. Cache the new user profile (same as RegisterUser) and invalidate the members list.
        await cacheService.SetAsync(
            CacheKeys.UserProfileById(user.Id),
            user.ToUserResponse(),
            cacheTtlOptions.Value.UserProfileById.Ttl
        );

        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));

        user.ClearSensitiveData();

        return ResponseCatalog.Organization.MemberInvited
            .As<Guid>()
            .WithData(user.Id)
            .ToOperationResult();
    }
}
