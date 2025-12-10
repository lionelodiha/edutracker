using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class BillingPlan : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = null!;
    public decimal Price { get; private set; }
    public string Interval { get; private set; } = "monthly"; // monthly, yearly
    public int MaxStudents { get; private set; } = 100;

    private BillingPlan() { }
    public BillingPlan(string name, decimal price, string interval, int maxStudents)
    {
        Name = name;
        Price = price;
        Interval = interval;
        MaxStudents = maxStudents;
    }
}
