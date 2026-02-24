using EduTracker.Domain.Abstractions;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPlan : IEntity
{
    private OrganizationPlan() { }

    public OrganizationPlan(string name, decimal monthlyPrice)
    {
        Name = name;
        MonthlyPrice = monthlyPrice;
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public string Name { get; private set; } = string.Empty;
    public decimal MonthlyPrice { get; private set; }

    public int MaxMembers { get; private set; }
    public bool AllowsAdvancedAnalytics { get; private set; }
}
