using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationSubscription : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();
    private OrganizationSubscription() { }

    public OrganizationSubscription(Guid organizationId, Guid planId, DateTime startsAt, DateTime? endsAt, bool autoRenew)
    {
        OrganizationId = organizationId;
        PlanId = planId;

        StartsAt = startsAt;
        EndsAt = endsAt;
        AutoRenew = autoRenew;
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid PlanId { get; private set; }
    public OrganizationPlan Plan { get; private set; } = null!;

    public DateTime StartsAt { get; private set; }
    public DateTime? EndsAt { get; private set; }

    public bool AutoRenew { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    public bool IsActive()
    {
        DateTime now = DateTime.UtcNow;

        return StartsAt <= now && (!EndsAt.HasValue || now < EndsAt.Value);
    }

    public bool IsExpired() => EndsAt.HasValue && DateTime.UtcNow >= EndsAt.Value;
    public bool IsCancelled() => CancelledAt.HasValue;

    public void Cancel(DateTime cancelledAt, DateTime periodEnd)
    {
        if (CancelledAt.HasValue) return;

        CancelledAt = cancelledAt;
        AutoRenew = false;

        EndsAt = periodEnd;
    }

    public void EnableAutoRenew()
    {
        if (AutoRenew) return;

        AutoRenew = true;
        AuditState.UpdateAudit();
    }

    public void DisableAutoRenew()
    {
        if (!AutoRenew) return;

        AutoRenew = false;
        AuditState.UpdateAudit();
    }
}
