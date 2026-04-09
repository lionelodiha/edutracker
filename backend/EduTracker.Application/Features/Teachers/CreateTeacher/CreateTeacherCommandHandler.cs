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

namespace EduTracker.Application.Features.Teachers.CreateTeacher;

internal sealed class CreateTeacherCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateTeacherCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateTeacherCommand message, CancellationToken cancellationToken = default)
    {
        await OrganizationAccessHelper.EnsureActorCanManageOrganizationAsync(db, message.ActorId, message.OrganizationId, cancellationToken);

        bool userExists = await db.Users
            .AsNoTracking()
            .AnyAsync(item => item.Id == message.UserId, cancellationToken);

        if (!userExists)
            throw ResponseCatalog.User.NotFound.ToException();

        var member = await OrganizationAccessHelper.GetOrCreateActiveMemberAsync(db, message.OrganizationId, message.UserId, cancellationToken);

        bool exists = await db.Teachers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationMemberId == member.Id
                    || (item.OrganizationId == message.OrganizationId
                        && item.StaffId == message.StaffId.Trim().ToUpperInvariant()),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Teacher.AlreadyExists.ToException();

        Teacher teacher = new(message.OrganizationId, member.Id, message.StaffId);

        db.Teachers.Add(teacher);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.OrganizationMembers(message.OrganizationId));
        await cacheService.RemoveAsync(CacheKeys.Teachers(message.OrganizationId));

        return ResponseCatalog.Teacher.Created
            .As<Guid>()
            .WithData(teacher.Id)
            .ToOperationResult();
    }
}
