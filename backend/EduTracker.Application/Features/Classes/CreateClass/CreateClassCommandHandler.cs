using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.CreateClass;

internal sealed class CreateClassCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateClassCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateClassCommand message, CancellationToken cancellationToken = default)
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

        CourseOffering offering = await db.CourseOfferings
            .AsNoTracking()
            .Include(item => item.Term.Semester)
            .FirstOrDefaultAsync(
                item => item.Id == message.CourseOfferingId && item.Term.Semester.OrganizationId == message.OrganizationId,
                cancellationToken
            )
            ?? throw ResponseCatalog.CourseOffering.NotFound.ToException();

        bool exists = await db.Classes
            .AsNoTracking()
            .AnyAsync(
                item => item.CourseOfferingId == message.CourseOfferingId && item.Code == message.Code,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Class.AlreadyExists.ToException();

        Class newClass = new(message.CourseOfferingId, message.Code, message.InstructorId, message.MaxCapacity);

        db.Classes.Add(newClass);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Class.Created
            .As<Guid>()
            .WithData(newClass.Id)
            .ToOperationResult();
    }
}
