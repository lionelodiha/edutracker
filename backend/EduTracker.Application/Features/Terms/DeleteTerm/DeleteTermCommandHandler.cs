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

namespace EduTracker.Application.Features.Terms.DeleteTerm;

internal sealed class DeleteTermCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<DeleteTermCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteTermCommand message, CancellationToken cancellationToken = default)
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

        Term term = await db.Terms
            .FirstOrDefaultAsync(
                item => item.Id == message.TermId && item.Semester.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Term.NotFound.ToException();

        Guid semesterId = term.SemesterId;

        db.Terms.Remove(term);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.TermById(message.TermId));
        await cacheService.RemoveAsync(CacheKeys.TermsBySemester(semesterId));
        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(semesterId));

        return ResponseCatalog.Term.Deleted.ToOperationResult();
    }
}
