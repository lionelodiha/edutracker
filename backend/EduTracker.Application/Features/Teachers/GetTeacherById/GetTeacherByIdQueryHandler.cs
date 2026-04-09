using EduTracker.Application.Configurations.Caching;
using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduTracker.Application.Features.Teachers.GetTeacherById;

internal sealed class GetTeacherByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetTeacherByIdQuery, OperationResult<TeacherResponse>>
{
    public async Task<OperationResult<TeacherResponse>> Handle(GetTeacherByIdQuery message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorIsActiveMemberAsync(db, message.UserId, message.OrganizationId, cancellationToken);

        string cacheKey = CacheKeys.TeacherById(message.TeacherId);
        TeacherResponse? cachedTeacher = await cacheService.GetAsync<TeacherResponse>(cacheKey);

        if (cachedTeacher is not null && cachedTeacher.OrganizationId == message.OrganizationId)
        {
            return ResponseCatalog.Teacher.Retrieved
                .As<TeacherResponse>()
                .WithData(cachedTeacher)
                .ToOperationResult();
        }

        var teacherEntry = await db.Teachers
            .AsNoTracking()
            .Where(item => item.Id == message.TeacherId && item.OrganizationId == message.OrganizationId)
            .Join(
                db.OrganizationMembers.AsNoTracking(),
                teacher => teacher.OrganizationMemberId,
                member => member.Id,
                (teacher, member) => new { teacher, member }
            )
            .Join(
                db.Users.AsNoTracking(),
                pair => pair.member.UserId,
                user => user.Id,
                (pair, user) => new { pair.teacher, user }
            )
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Teacher.NotFound.ToException();

        UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
            encryptionService.Decrypt(teacherEntry.user.EncryptedData, CryptoPurpose.UserSensitiveData)
        );

        TeacherResponse response = new(
            teacherEntry.teacher.Id,
            teacherEntry.user.Id,
            teacherEntry.user.UserName,
            sensitiveData.FirstName,
            sensitiveData.LastName,
            teacherEntry.teacher.StaffId,
            teacherEntry.teacher.OrganizationId,
            teacherEntry.teacher.OrganizationMemberId,
            teacherEntry.teacher.CreatedAt
        );

        await cacheService.SetAsync(cacheKey, response, cacheTtlOptions.Value.TeacherById.Ttl);

        return ResponseCatalog.Teacher.Retrieved
            .As<TeacherResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
