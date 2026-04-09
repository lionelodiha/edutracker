using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Students.UpdateStudent;

internal sealed class UpdateStudentCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<UpdateStudentCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateStudentCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        var student = await db.Students
            .FirstOrDefaultAsync(
                item => item.Id == message.StudentId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Student.NotFound.ToException();

        if (message.ClassId.HasValue)
        {
            bool classExists = await db.Classes
                .AsNoTracking()
                .AnyAsync(
                    item => item.Id == message.ClassId.Value && item.OrganizationId == message.OrganizationId,
                    cancellationToken
                );

            if (!classExists)
                throw ResponseCatalog.Class.NotFound.ToException();
        }

        bool exists = await db.Students
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.Id != message.StudentId
                    && item.StudentNumber == message.StudentNumber.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Student.AlreadyExists.ToException();

        Guid? previousClassId = student.ClassId;

        student.UpdateStudentNumber(message.StudentNumber);
        student.AssignClass(message.ClassId);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.StudentById(student.Id));
        await cacheService.RemoveAsync(CacheKeys.Students(message.OrganizationId));

        if (previousClassId.HasValue)
            await cacheService.RemoveAsync(CacheKeys.ClassById(previousClassId.Value));

        if (message.ClassId.HasValue)
            await cacheService.RemoveAsync(CacheKeys.ClassById(message.ClassId.Value));

        return ResponseCatalog.Student.Updated.ToOperationResult();
    }
}
