using System.Text.Json.Serialization;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class OrganizationPlanSensitive : ISensitiveData
{
    [JsonConstructor]
    private OrganizationPlanSensitive(string productId)
    {
        ProductId = productId;
    }

    public string ProductId { get; private set; }

    public static OrganizationPlanSensitive Create(string productId)
    {
        if (string.IsNullOrWhiteSpace(productId))
            throw new ArgumentException("Product id is required.", nameof(productId));

        return new OrganizationPlanSensitive(productId);
    }
}
