using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Students.CreateStudent;

internal sealed class CreateStudentCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateStudentCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateStudentCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        bool userExists = await db.Users
            .AsNoTracking()
            .AnyAsync(item => item.Id == message.UserId, cancellationToken);

        if (!userExists)
            throw ResponseCatalog.User.NotFound.ToException();

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

        var member = await OrganizationAccessHelper.GetOrCreateActiveMemberAsync(db, message.OrganizationId, message.UserId, cancellationToken);

        bool exists = await db.Students
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationMemberId == member.Id
                    || (item.OrganizationId == message.OrganizationId
                        && item.StudentNumber == message.StudentNumber.Trim().ToUpperInvariant()),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Student.AlreadyExists.ToException();

        Student student = new(message.OrganizationId, member.Id, message.StudentNumber, message.ClassId);

        db.Students.Add(student);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.Students(message.OrganizationId));
        if (message.ClassId.HasValue)
            await cacheService.RemoveAsync(CacheKeys.ClassById(message.ClassId.Value));

        return ResponseCatalog.Student.Created
            .As<Guid>()
            .WithData(student.Id)
            .ToOperationResult();
    }
}
