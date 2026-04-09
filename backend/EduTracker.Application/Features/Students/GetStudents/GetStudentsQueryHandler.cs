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

namespace EduTracker.Application.Features.Students.GetStudents;

internal sealed class GetStudentsQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetStudentsQuery, OperationResult<IReadOnlyList<StudentResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<StudentResponse>>> Handle(GetStudentsQuery message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorIsActiveMemberAsync(db, message.UserId, message.OrganizationId, cancellationToken);

        string cacheKey = CacheKeys.Students(message.OrganizationId);
        List<StudentResponse>? cachedStudents = await cacheService.GetAsync<List<StudentResponse>>(cacheKey);

        if (cachedStudents is not null)
        {
            return ResponseCatalog.Student.Retrieved
                .As<IReadOnlyList<StudentResponse>>()
                .WithData(cachedStudents)
                .ToOperationResult();
        }

        var studentEntries = await (
            from student in db.Students.AsNoTracking()
            where student.OrganizationId == message.OrganizationId
            join member in db.OrganizationMembers.AsNoTracking()
                on student.OrganizationMemberId equals member.Id
            join user in db.Users.AsNoTracking()
                on member.UserId equals user.Id
            join classItem in db.Classes.AsNoTracking()
                on student.ClassId equals classItem.Id into classGroup
            from classItem in classGroup.DefaultIfEmpty()
            select new { student, user, classItem }
        )
            .OrderBy(item => item.user.UserName)
            .ToListAsync(cancellationToken);

        List<StudentResponse> students = new(studentEntries.Count);

        foreach (var entry in studentEntries)
        {
            UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
                encryptionService.Decrypt(entry.user.EncryptedData, CryptoPurpose.UserSensitiveData)
            );

            students.Add(new StudentResponse(
                entry.student.Id,
                entry.user.Id,
                entry.user.UserName,
                sensitiveData.FirstName,
                sensitiveData.LastName,
                entry.student.StudentNumber,
                entry.student.OrganizationId,
                entry.student.OrganizationMemberId,
                entry.student.ClassId,
                entry.classItem?.Name,
                entry.student.CreatedAt
            ));
        }

        await cacheService.SetAsync(cacheKey, students, cacheTtlOptions.Value.Students.Ttl);

        return ResponseCatalog.Student.Retrieved
            .As<IReadOnlyList<StudentResponse>>()
            .WithData(students)
            .ToOperationResult();
    }
}
