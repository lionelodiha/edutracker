using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Billing;
using EduTracker.Domain.Enums;
using EduTracker.Domain.Entities.Security;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Subscriptions.CreateOrganizationSubscription;

public sealed class CreateOrganizationSubscriptionCommandHandler(
    AppDbContext db
) : IHandler<CreateOrganizationSubscriptionCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateOrganizationSubscriptionCommand message, CancellationToken cancellationToken = default)
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

        bool activeExists = await db.OrganizationSubscriptions.AnyAsync(
            s => s.OrganizationId == organization.Id && s.Status == SubscriptionStatus.Active,
            cancellationToken
        );

        if (activeExists)
            throw ResponseCatalog.Subscription.ActiveExists.ToException();

        OrganizationSubscription subscription = new(
            organizationId: organization.Id,
            ownerUserId: organization.OwnerUserId,
            plan: message.Plan,
            status: SubscriptionStatus.Active,
            currentPeriodStart: message.CurrentPeriodStart,
            currentPeriodEnd: message.CurrentPeriodEnd,
            trialEndsAt: message.TrialEndsAt
        );

        db.OrganizationSubscriptions.Add(subscription);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Subscription.Created
            .As<Guid>()
            .WithData(subscription.Id)
            .ToOperationResult();
    }
}
