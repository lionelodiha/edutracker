using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Security;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.UpdateOrganizationMemberRole;

public sealed class UpdateOrganizationMemberRoleCommandHandler(
    AppDbContext db
) : IHandler<UpdateOrganizationMemberRoleCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateOrganizationMemberRoleCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || !actor.HasRole(RoleKeys.OrganizationAdmin))
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember member = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .FirstOrDefaultAsync(m => m.Id == message.MemberId && m.OrganizationId == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.MemberNotFound.ToException();

        RbacRole roleToAssign = await db.RbacRoles
            .FirstOrDefaultAsync(r => r.Key == message.RoleKey && r.OrganizationId == message.OrganizationId, cancellationToken)
            ?? await db.RbacRoles
            .FirstOrDefaultAsync(r => r.Key == message.RoleKey && r.IsSystem, cancellationToken)
            ?? throw new EduTracker.Application.Exceptions.AppException("ROLE_NOT_FOUND", 404, "Role not found");

        // Revoke existing roles for MVP simplicity
        foreach (var assignment in member.RoleAssignments.Where(ra => ra.IsActive).ToList())
        {
            member.RevokeRole(assignment.RoleId);
        }

        member.AssignRole(roleToAssign.Id, message.ActorId.Value);

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Organization.MemberRoleUpdated
            .ToOperationResult();
    }
}
