using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationSubscription : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();
    private OrganizationSubscription() { }

    public OrganizationSubscription(
        Guid organizationId,
        Guid planId,
        DateTime startsAt,
        DateTime? endsAt,
        bool autoRenew)
    {
        Id = Guid.CreateVersion7();
        OrganizationId = organizationId;
        PlanId = planId;
        StartsAt = startsAt;
        EndsAt = endsAt;
        AutoRenew = autoRenew;
    }

    public Guid Id { get; private set; }

    public Guid OrganizationId { get; private set; }
    public Guid PlanId { get; private set; }

    public DateTime StartsAt { get; private set; }
    public DateTime? EndsAt { get; private set; }

    // Determines if the system should create a renewal when period ends
    public bool AutoRenew { get; private set; }

    // User intent — tells us the subscription was cancelled
    public DateTime? CancelledAt { get; private set; }

    public DateTime CreatedAt => throw new NotImplementedException();

    public DateTime UpdatedAt => throw new NotImplementedException();

    // --------------------------------------------
    // Derived State (No Stored Status Enum)
    // --------------------------------------------

    public bool IsActive()
    {
        var now = DateTime.UtcNow;

        return StartsAt <= now &&
               (!EndsAt.HasValue || now < EndsAt.Value);
    }

    public bool IsExpired()
    {
        return EndsAt.HasValue &&
               DateTime.UtcNow >= EndsAt.Value;
    }

    public bool IsCancelled()
    {
        return CancelledAt.HasValue;
    }

    // --------------------------------------------
    // Behavior
    // --------------------------------------------

    public void Cancel(DateTime cancelledAt, DateTime periodEnd)
    {
        if (CancelledAt.HasValue)
            return;

        CancelledAt = cancelledAt;
        AutoRenew = false;

        // Subscription remains active until end of billing cycle
        EndsAt = periodEnd;
    }

    public void DisableAutoRenew()
    {
        if (!AutoRenew) return;

        AutoRenew = false;
        AuditState.UpdateAudit();
    }
}
