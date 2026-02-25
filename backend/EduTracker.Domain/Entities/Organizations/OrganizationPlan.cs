using System.Text.Json.Serialization;
using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPlan : IEntity
{
    private OrganizationPlan() { }

    public OrganizationPlan(string name, string productId)
    {
        Name = name;
        ProductId = productId;
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public string Name { get; private set; } = string.Empty;
    public string ProductId { get; private set; } = string.Empty;
}

public sealed class OrganizationPlanSensitive : ISensitiveData
{
    [JsonConstructor]
    private OrganizationPlanSensitive(string productId)
    {
        ProductId = productId;
    }

    public string ProductId { get; private set; } = string.Empty;

    public static OrganizationPlanSensitive Create()
    {
        return new OrganizationPlanSensitive(string.Empty);
    }
}

