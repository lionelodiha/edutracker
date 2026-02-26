using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Helpers;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Application.Enums;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Subscriptions.CreateOrganizationSubscription;

internal sealed class CreateOrganizationSubscriptionCommandHandler(
    AppDbContext db,
    IDataEncryptionService encryptionService,
    IPaymentService paymentService
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
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == organization.Id && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        bool planExists = await db.OrganizationPlans.AnyAsync(p => p.Id == message.PlanId, cancellationToken);
        if (!planExists)
            throw ResponseCatalog.Subscription.NotFound.ToException();

        OrganizationPaymentMethod? paymentMethod = await db.OrganizationPaymentMethods
            .AsNoTracking()
            .Where(pm => pm.OrganizationId == organization.Id)
            .OrderByDescending(pm => pm.IsDefault)
            .ThenBy(pm => pm.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (paymentMethod is null || paymentMethod.EncryptedData.Length == 0)
            throw ResponseCatalog.Subscription.PaymentMethodRequired.ToException();

        OrganizationPaymentMethodSensitive paymentMethodSensitive = ObjectByteConverter.DeserializeFromBytes<OrganizationPaymentMethodSensitive>(
            encryptionService.Decrypt(paymentMethod.EncryptedData, CryptoPurpose.OrganizationPaymentMethodSensitiveData)
        );

        bool activeExists = await db.OrganizationSubscriptions.AnyAsync(
            s => s.OrganizationId == organization.Id
                 && !s.CancelledAt.HasValue
                 && s.StartsAt <= DateTime.UtcNow
                 && (!s.EndsAt.HasValue || s.EndsAt.Value > DateTime.UtcNow),
            cancellationToken
        );

        if (activeExists)
            throw ResponseCatalog.Subscription.ActiveExists.ToException();

        PaymentServiceResult paymentResult = await paymentService.CreateSubscriptionAsync(
            new CreatePaymentSubscriptionRequest(
                OrganizationId: organization.Id,
                PlanId: message.PlanId,
                StartsAt: message.StartsAt,
                EndsAt: message.EndsAt,
                AutoRenew: message.AutoRenew,
                Provider: paymentMethod.Provider,
                ProviderCustomerId: paymentMethodSensitive.ProviderCustomerId,
                ProviderPaymentMethodId: paymentMethodSensitive.ProviderPaymentMethodId
            ),
            cancellationToken
        );

        if (!paymentResult.Succeeded)
            throw ResponseCatalog.Subscription.PaymentFailed.ToException();

        OrganizationSubscription subscription = new(
            organizationId: organization.Id,
            planId: message.PlanId,
            startsAt: message.StartsAt,
            endsAt: message.EndsAt,
            autoRenew: message.AutoRenew
        );

        db.OrganizationSubscriptions.Add(subscription);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Subscription.Created
            .As<Guid>()
            .WithData(subscription.Id)
            .ToOperationResult();
    }
}
