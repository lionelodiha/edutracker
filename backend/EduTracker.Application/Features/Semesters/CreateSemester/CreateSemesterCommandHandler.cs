using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Semesters.CreateSemester;

internal sealed class CreateSemesterCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateSemesterCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateSemesterCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var organizationState = await db.Organizations
            .AsNoTracking()
            .Where(item => item.Id == message.OrganizationId)
            .Select(item => new { item.IsLocked })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organizationState.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();

        bool canManage = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.UserId == message.ActorId.Value
                    && item.Status == OrganizationMemberStatus.Active
                    && (item.Role == OrganizationMemberRole.Owner || item.Role == OrganizationMemberRole.Moderator),
                cancellationToken
            );

        if (!canManage)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        bool exists = await db.Semesters
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.StartYear == message.StartYear,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Semester.AlreadyExists.ToException();

        Semester semester = new(message.OrganizationId, message.StartYear);

        db.Semesters.Add(semester);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.Semesters(message.OrganizationId));

        return ResponseCatalog.Semester.Created
            .As<Guid>()
            .WithData(semester.Id)
            .ToOperationResult();
    }
}
