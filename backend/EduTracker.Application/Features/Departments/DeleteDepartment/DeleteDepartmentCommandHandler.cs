using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Departments.DeleteDepartment;

internal sealed class DeleteDepartmentCommandHandler(
    AppDbContext db
) : IHandler<DeleteDepartmentCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(DeleteDepartmentCommand message, CancellationToken cancellationToken = default)
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

        Department? department = await db.Departments
            .FirstOrDefaultAsync(
                d => d.Id == message.DepartmentId && d.OrganizationId == message.OrganizationId,
                cancellationToken
            );

        if (department is null)
            throw ResponseCatalog.Department.NotFound.ToException();

        db.Departments.Remove(department);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Department.Deleted.ToOperationResult();
    }
}
