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

namespace EduTracker.Application.Features.CourseOfferings.CreateCourseOffering;

internal sealed class CreateCourseOfferingCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateCourseOfferingCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateCourseOfferingCommand message, CancellationToken cancellationToken = default)
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

        Course course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseId && item.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        Term term = await db.Terms
            .AsNoTracking()
            .Include(item => item.Semester)
            .FirstOrDefaultAsync(
                item => item.Id == message.TermId && item.Semester.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.Term.NotFound.ToException();

        if (course.OrganizationId != term.Semester.OrganizationId)
            throw ResponseCatalog.CourseOffering.OrganizationMismatch.ToException();

        bool exists = await db.CourseOfferings
            .AsNoTracking()
            .AnyAsync(
                item => item.CourseId == message.CourseId && item.TermId == message.TermId,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.CourseOffering.AlreadyExists.ToException();

        CourseOffering offering = new(message.TermId, message.CourseId);

        db.CourseOfferings.Add(offering);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.CourseOfferingsBySemester(term.SemesterId));

        return ResponseCatalog.CourseOffering.Created
            .As<Guid>()
            .WithData(offering.Id)
            .ToOperationResult();
    }
}
