using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
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
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Admin)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember member = await db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.Id == message.MemberId && m.OrganizationId == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.MemberNotFound.ToException();

        member.UpdateRole(message.Role);

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Organization.MemberRoleUpdated
            .ToOperationResult();
    }
}
