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

namespace EduTracker.Application.Features.Students.GetStudentById;

internal sealed class GetStudentByIdQueryHandler(
    AppDbContext db,
    ICacheService cacheService,
    IOptions<CacheTimeToLiveOptions> cacheTtlOptions,
    IDataEncryptionService encryptionService
) : IHandler<GetStudentByIdQuery, OperationResult<StudentResponse>>
{
    public async Task<OperationResult<StudentResponse>> Handle(GetStudentByIdQuery message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorIsActiveMemberAsync(db, message.UserId, message.OrganizationId, cancellationToken);

        string cacheKey = CacheKeys.StudentById(message.StudentId);
        StudentResponse? cachedStudent = await cacheService.GetAsync<StudentResponse>(cacheKey);

        if (cachedStudent is not null && cachedStudent.OrganizationId == message.OrganizationId)
        {
            return ResponseCatalog.Student.Retrieved
                .As<StudentResponse>()
                .WithData(cachedStudent)
                .ToOperationResult();
        }

        var studentEntry = await (
            from student in db.Students.AsNoTracking()
            where student.Id == message.StudentId && student.OrganizationId == message.OrganizationId
            join member in db.OrganizationMembers.AsNoTracking()
                on student.OrganizationMemberId equals member.Id
            join user in db.Users.AsNoTracking()
                on member.UserId equals user.Id
            join classItem in db.Classes.AsNoTracking()
                on student.ClassId equals classItem.Id into classGroup
            from classItem in classGroup.DefaultIfEmpty()
            select new { student, user, classItem }
        )
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Student.NotFound.ToException();

        UserSensitive sensitiveData = ObjectByteConverter.DeserializeFromBytes<UserSensitive>(
            encryptionService.Decrypt(studentEntry.user.EncryptedData, CryptoPurpose.UserSensitiveData)
        );

        StudentResponse response = new(
            studentEntry.student.Id,
            studentEntry.user.Id,
            studentEntry.user.UserName,
            sensitiveData.FirstName,
            sensitiveData.LastName,
            studentEntry.student.StudentNumber,
            studentEntry.student.OrganizationId,
            studentEntry.student.OrganizationMemberId,
            studentEntry.student.ClassId,
            studentEntry.classItem?.Name,
            studentEntry.student.CreatedAt
        );

        await cacheService.SetAsync(cacheKey, response, cacheTtlOptions.Value.StudentById.Ttl);

        return ResponseCatalog.Student.Retrieved
            .As<StudentResponse>()
            .WithData(response)
            .ToOperationResult();
    }
}
