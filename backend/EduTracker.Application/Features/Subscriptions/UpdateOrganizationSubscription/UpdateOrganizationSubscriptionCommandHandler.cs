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

namespace EduTracker.Application.Features.Subscriptions.UpdateOrganizationSubscription;

internal sealed class UpdateOrganizationSubscriptionCommandHandler(
    AppDbContext db,
    IDataEncryptionService encryptionService,
    IPaymentService paymentService
) : IHandler<UpdateOrganizationSubscriptionCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(UpdateOrganizationSubscriptionCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Owner)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationSubscription subscription = await db.OrganizationSubscriptions
            .Where(s => s.OrganizationId == message.OrganizationId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Subscription.NotFound.ToException();

        if (message.AutoRenew.HasValue)
        {
            if (message.AutoRenew.Value)
                subscription.EnableAutoRenew();
            else
                subscription.DisableAutoRenew();
        }

        Guid targetPlanId = message.PlanId ?? subscription.PlanId;
        DateTime targetStartsAt = message.StartsAt ?? subscription.StartsAt;
        DateTime? targetEndsAt = message.EndsAt ?? subscription.EndsAt;
        bool requiresReplacement = targetPlanId != subscription.PlanId
            || targetStartsAt != subscription.StartsAt
            || targetEndsAt != subscription.EndsAt;

        if (message.PlanId.HasValue)
        {
            bool planExists = await db.OrganizationPlans.AnyAsync(p => p.Id == message.PlanId.Value, cancellationToken);
            if (!planExists)
                throw ResponseCatalog.Subscription.NotFound.ToException();
        }

        OrganizationPaymentMethod? paymentMethod = await db.OrganizationPaymentMethods
            .AsNoTracking()
            .Where(pm => pm.OrganizationId == message.OrganizationId)
            .OrderByDescending(pm => pm.IsDefault)
            .ThenBy(pm => pm.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (paymentMethod is null || paymentMethod.EncryptedData.Length == 0)
            throw ResponseCatalog.Subscription.PaymentMethodRequired.ToException();

        OrganizationPaymentMethodSensitive paymentMethodSensitive = ObjectByteConverter.DeserializeFromBytes<OrganizationPaymentMethodSensitive>(
            encryptionService.Decrypt(paymentMethod.EncryptedData, CryptoPurpose.OrganizationPaymentMethodSensitiveData)
        );

        PaymentServiceResult paymentResult = await paymentService.UpdateSubscriptionAsync(
            new UpdatePaymentSubscriptionRequest(
                OrganizationId: message.OrganizationId,
                SubscriptionId: subscription.Id,
                PlanId: targetPlanId,
                StartsAt: targetStartsAt,
                EndsAt: targetEndsAt,
                AutoRenew: message.AutoRenew ?? subscription.AutoRenew,
                Provider: paymentMethod.Provider,
                ProviderCustomerId: paymentMethodSensitive.ProviderCustomerId,
                ProviderPaymentMethodId: paymentMethodSensitive.ProviderPaymentMethodId
            ),
            cancellationToken
        );

        if (!paymentResult.Succeeded)
            throw ResponseCatalog.Subscription.PaymentFailed.ToException();

        if (requiresReplacement)
        {
            if (!subscription.IsCancelled())
            {
                DateTime periodEnd = DateTime.UtcNow;
                subscription.Cancel(DateTime.UtcNow, periodEnd);
            }

            OrganizationSubscription replacement = new(
                organizationId: message.OrganizationId,
                planId: targetPlanId,
                startsAt: targetStartsAt,
                endsAt: targetEndsAt,
                autoRenew: message.AutoRenew ?? subscription.AutoRenew
            );

            db.OrganizationSubscriptions.Add(replacement);
        }

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Subscription.Updated.ToOperationResult();
    }
}
