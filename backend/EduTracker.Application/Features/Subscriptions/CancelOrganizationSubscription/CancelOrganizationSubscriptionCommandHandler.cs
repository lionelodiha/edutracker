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

namespace EduTracker.Application.Features.Subscriptions.CancelOrganizationSubscription;

internal sealed class CancelOrganizationSubscriptionCommandHandler(
    AppDbContext db,
    IDataEncryptionService encryptionService,
    IPaymentService paymentService
) : IHandler<CancelOrganizationSubscriptionCommand, OperationResult<object>>
{
    public async Task<OperationResult<object>> Handle(CancelOrganizationSubscriptionCommand message, CancellationToken cancellationToken = default)
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

        PaymentServiceResult paymentResult = await paymentService.CancelSubscriptionAsync(
            new CancelPaymentSubscriptionRequest(
                OrganizationId: message.OrganizationId,
                SubscriptionId: subscription.Id,
                Provider: paymentMethod.Provider,
                ProviderCustomerId: paymentMethodSensitive.ProviderCustomerId
            ),
            cancellationToken
        );

        if (!paymentResult.Succeeded)
            throw ResponseCatalog.Subscription.PaymentFailed.ToException();

        DateTime periodEnd = subscription.EndsAt ?? DateTime.UtcNow;
        subscription.Cancel(DateTime.UtcNow, periodEnd);

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Subscription.Canceled.ToOperationResult();
    }
}
