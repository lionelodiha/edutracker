using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.CreateOrganization;

public sealed class CreateOrganizationCommandHandler(
    AppDbContext db
) : IHandler<CreateOrganizationCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateOrganizationCommand message, CancellationToken cancellationToken = default)
    {
        if (message.OwnerUserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool userExists = await db.Users.AnyAsync(u => u.Id == message.OwnerUserId.Value, cancellationToken);
        if (!userExists)
            throw ResponseCatalog.User.NotFound.ToException();

        Organization organization = new(message.Name, message.OwnerUserId.Value);
        OrganizationMember ownerMember = new(
            organizationId: organization.Id,
            userId: message.OwnerUserId.Value,
            role: OrganizationMemberRole.Admin,
            status: OrganizationMemberStatus.Active
        );

        db.Organizations.Add(organization);
        db.OrganizationMembers.Add(ownerMember);

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Organization.Created
            .As<Guid>()
            .WithData(organization.Id)
            .ToOperationResult();
    }
}
