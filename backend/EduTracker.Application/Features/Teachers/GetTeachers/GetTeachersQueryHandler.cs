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

namespace EduTracker.Application.Features.Teachers.GetTeachers;

internal sealed class GetTeachersQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetTeachersQuery, OperationResult<IReadOnlyList<TeacherResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<TeacherResponse>>> Handle(GetTeachersQuery message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorIsActiveMemberAsync(db, message.UserId, message.OrganizationId, cancellationToken);

        string cacheKey = CacheKeys.Teachers(message.OrganizationId);
        List<TeacherResponse>? cachedTeachers = await cacheService.GetAsync<List<TeacherResponse>>(cacheKey);

        if (cachedTeachers is not null)
        {
            return ResponseCatalog.Teacher.Retrieved
                .As<IReadOnlyList<TeacherResponse>>()
                .WithData(cachedTeachers)
                .ToOperationResult();
        }

        var teacherEntries = await db.Teachers
            .AsNoTracking()
            .Where(item => item.OrganizationId == message.OrganizationId)
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
                (pair, user) => new { pair.teacher, pair.member, user }
            )
            .OrderBy(item => item.user.UserName)
            .ToListAsync(cancellationToken);

        List<TeacherResponse> teachers = new(teacherEntries.Count);

        foreach (var entry in teacherEntries)
        {
            UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
                encryptionService.Decrypt(entry.user.EncryptedData, CryptoPurpose.UserSensitiveData)
            );

            teachers.Add(new TeacherResponse(
                entry.teacher.Id,
                entry.user.Id,
                entry.user.UserName,
                sensitiveData.FirstName,
                sensitiveData.LastName,
                entry.teacher.StaffId,
                entry.teacher.OrganizationId,
                entry.teacher.OrganizationMemberId,
                entry.teacher.CreatedAt
            ));
        }

        await cacheService.SetAsync(cacheKey, teachers, cacheTtlOptions.Value.Teachers.Ttl);

        return ResponseCatalog.Teacher.Retrieved
            .As<IReadOnlyList<TeacherResponse>>()
            .WithData(teachers)
            .ToOperationResult();
    }
}
