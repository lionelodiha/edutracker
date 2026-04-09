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

namespace EduTracker.Application.Features.Teachers.JoinTeacher;

internal sealed class JoinTeacherCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<JoinTeacherCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(JoinTeacherCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        await OrganizationAccessHelper.EnsureOrganizationIsAvailableAsync(db, message.OrganizationId, cancellationToken);

        var member = await OrganizationAccessHelper.GetOrCreateActiveMemberAsync(db, message.OrganizationId, message.ActorId.Value, cancellationToken);

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

        return ResponseCatalog.Teacher.Joined
            .As<Guid>()
            .WithData(teacher.Id)
            .ToOperationResult();
    }
}
