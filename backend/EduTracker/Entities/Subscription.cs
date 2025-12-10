using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class Subscription : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }
    public Guid BillingPlanId { get; private set; }

    public DateTime StartsOn { get; private set; }
    public DateTime? EndsOn { get; private set; }
    public string Status { get; private set; } = "active"; // active, canceled, past_due

    public School School { get; private set; } = null!;
    public BillingPlan BillingPlan { get; private set; } = null!;

    private Subscription() { }
    public Subscription(Guid schoolId, Guid planId, DateTime startsOn)
    {
        SchoolId = schoolId;
        BillingPlanId = planId;
        StartsOn = startsOn;
    }

    public void Cancel(DateTime endsOn)
    {
        EndsOn = endsOn;
        Status = "canceled";
    }
}
