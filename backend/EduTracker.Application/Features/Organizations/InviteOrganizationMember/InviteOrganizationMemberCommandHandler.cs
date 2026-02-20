using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Security;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.InviteOrganizationMember;

public sealed class InviteOrganizationMemberCommandHandler(
    AppDbContext db
) : IHandler<InviteOrganizationMemberCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(InviteOrganizationMemberCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        Organization organization = await db.Organizations
            .FirstOrDefaultAsync(o => o.Id == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == organization.Id && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || !actor.HasRole(RoleKeys.OrganizationAdmin))
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        bool targetExists = await db.Users.AnyAsync(u => u.Id == message.UserId, cancellationToken);
        if (!targetExists)
            throw ResponseCatalog.User.NotFound.ToException();

        bool alreadyMember = await db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == organization.Id && m.UserId == message.UserId, cancellationToken);

        if (alreadyMember)
            throw ResponseCatalog.Organization.MemberAlreadyExists.ToException();

        RbacRole roleToAssign = await db.RbacRoles
            .FirstOrDefaultAsync(r => r.Key == message.RoleKey && r.OrganizationId == organization.Id, cancellationToken)
            ?? await db.RbacRoles
            .FirstOrDefaultAsync(r => r.Key == message.RoleKey && r.IsSystem, cancellationToken)
            ?? throw new EduTracker.Application.Exceptions.AppException("ROLE_NOT_FOUND", 404, "Role not found");

        OrganizationMember member = new(
            organizationId: organization.Id,
            userId: message.UserId,
            status: OrganizationMemberStatus.Invited
        );

        member.AssignRole(roleToAssign.Id, message.ActorId.Value);

        db.OrganizationMembers.Add(member);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Organization.MemberInvited
            .As<Guid>()
            .WithData(member.Id)
            .ToOperationResult();
    }
}
