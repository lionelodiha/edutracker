using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.GetOrganizationMembers;

public sealed class GetOrganizationMembersQueryHandler(
    AppDbContext db
) : IHandler<GetOrganizationMembersQuery, OperationResult<IReadOnlyList<OrganizationMemberResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<OrganizationMemberResponse>>> Handle(GetOrganizationMembersQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        List<OrganizationMemberResponse> members = await db.OrganizationMembers
            .AsNoTracking()
            .Where(m => m.OrganizationId == message.OrganizationId)
            .Select(m => m.ToOrganizationMemberResponse())
            .ToListAsync(cancellationToken);

        return ResponseCatalog.Organization.MembersRetrieved
            .As<IReadOnlyList<OrganizationMemberResponse>>()
            .WithData(members)
            .ToOperationResult();
    }
}
