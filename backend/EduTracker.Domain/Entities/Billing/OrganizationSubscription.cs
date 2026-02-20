using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Enums;

namespace EduTracker.Domain.Entities.Billing;

public sealed class OrganizationSubscription : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private OrganizationSubscription() { }

    public OrganizationSubscription(
        Guid organizationId,
        Guid ownerUserId,
        SubscriptionPlan plan,
        SubscriptionStatus status,
        DateTime currentPeriodStart,
        DateTime currentPeriodEnd,
        DateTime? trialEndsAt = null,
        BillingCycle billingCycle = BillingCycle.Monthly,
        bool renewAuto = true
    )
    {
        if (currentPeriodEnd <= currentPeriodStart)
            throw new ArgumentException("Current period end must be later than start.", nameof(currentPeriodEnd));

        OrganizationId = organizationId;
        OwnerUserId = ownerUserId;
        Plan = plan;
        Status = status;
        StartUtc = currentPeriodStart;
        EndUtc = currentPeriodEnd;
        TrialEndsUtc = trialEndsAt;
        BillingCycle = billingCycle;
        RenewAuto = renewAuto;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid OwnerUserId { get; private set; }
    public User OwnerUser { get; private set; } = null!;

    public Guid? PlanId { get; private set; }
    public OrganizationPlan? PlanCatalog { get; private set; }

    public SubscriptionPlan Plan { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public BillingCycle BillingCycle { get; private set; }

    public DateTime StartUtc { get; private set; }
    public DateTime EndUtc { get; private set; }
    public DateTime? TrialEndsUtc { get; private set; }
    public bool RenewAuto { get; private set; }

    // Legacy aliases maintained for existing backend handlers and persistence.
    public DateTime CurrentPeriodStart => StartUtc;
    public DateTime CurrentPeriodEnd => EndUtc;
    public DateTime? TrialEndsAt => TrialEndsUtc;

    public void AttachPlan(Guid planId)
    {
        PlanId = planId;
        AuditState.UpdateAudit();
    }

    public void UpdatePlan(SubscriptionPlan newPlan)
    {
        if (!Enum.IsDefined(newPlan))
            throw new ArgumentException("Invalid subscription plan.", nameof(newPlan));

        if (Plan == newPlan) return;

        Plan = newPlan;
        AuditState.UpdateAudit();
    }

    public void UpdateStatus(SubscriptionStatus newStatus)
    {
        if (!Enum.IsDefined(newStatus))
            throw new ArgumentException("Invalid subscription status.", nameof(newStatus));

        if (Status == newStatus) return;

        Status = newStatus;
        AuditState.UpdateAudit();
    }

    public void UpdatePeriod(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc)
            throw new ArgumentException("Subscription end must be later than start.", nameof(endUtc));

        StartUtc = startUtc;
        EndUtc = endUtc;
        AuditState.UpdateAudit();
    }

    public void UpdateTrialEnds(DateTime? trialEndsUtc)
    {
        if (trialEndsUtc is not null && trialEndsUtc.Value < StartUtc)
            throw new ArgumentException("Trial end cannot be earlier than subscription start.", nameof(trialEndsUtc));

        TrialEndsUtc = trialEndsUtc;
        AuditState.UpdateAudit();
    }

    public void UpdateBillingCycle(BillingCycle billingCycle)
    {
        if (!Enum.IsDefined(billingCycle))
            throw new ArgumentException("Invalid billing cycle.", nameof(billingCycle));

        if (BillingCycle == billingCycle) return;

        BillingCycle = billingCycle;
        AuditState.UpdateAudit();
    }

    public void SetAutoRenew(bool renewAuto)
    {
        if (RenewAuto == renewAuto) return;

        RenewAuto = renewAuto;
        AuditState.UpdateAudit();
    }
}
