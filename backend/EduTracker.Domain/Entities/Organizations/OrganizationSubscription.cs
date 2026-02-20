using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;
using EduTracker.Domain.Enums;

namespace EduTracker.Domain.Entities.Organizations;

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
        DateTime? trialEndsAt = null
    )
    {
        if (!Enum.IsDefined(plan))
            throw new ArgumentException("Invalid subscription plan.", nameof(plan));

        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid subscription status.", nameof(status));

        if (currentPeriodEnd <= currentPeriodStart)
            throw new ArgumentException("Current period end must be after current period start.", nameof(currentPeriodEnd));

        OrganizationId = organizationId;
        OwnerUserId = ownerUserId;
        Plan = plan;
        Status = status;
        TrialEndsAt = trialEndsAt;
        CurrentPeriodStart = currentPeriodStart;
        CurrentPeriodEnd = currentPeriodEnd;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid OwnerUserId { get; private set; }
    public User OwnerUser { get; private set; } = null!;

    public SubscriptionPlan Plan { get; private set; }
    public SubscriptionStatus Status { get; private set; }

    public DateTime? TrialEndsAt { get; private set; }
    public DateTime CurrentPeriodStart { get; private set; }
    public DateTime CurrentPeriodEnd { get; private set; }

    public void UpdatePlan(SubscriptionPlan plan)
    {
        if (!Enum.IsDefined(plan))
            throw new ArgumentException("Invalid subscription plan.", nameof(plan));

        Plan = plan;
        AuditState.UpdateAudit();
    }

    public void UpdateStatus(SubscriptionStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ArgumentException("Invalid subscription status.", nameof(status));

        Status = status;
        AuditState.UpdateAudit();
    }

    public void UpdatePeriod(DateTime start, DateTime end)
    {
        if (end <= start)
            throw new ArgumentException("Current period end must be after current period start.", nameof(end));

        CurrentPeriodStart = start;
        CurrentPeriodEnd = end;
        AuditState.UpdateAudit();
    }

    public void UpdateTrial(DateTime? trialEndsAt)
    {
        TrialEndsAt = trialEndsAt;
        AuditState.UpdateAudit();
    }
}
