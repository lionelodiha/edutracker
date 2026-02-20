using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class Organization : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Organization() { }

    public Organization(string name, Guid ownerUserId)
    {
        SetName(name);
        OwnerUserId = ownerUserId;
        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;

    public Guid OwnerUserId { get; private set; }
    public User OwnerUser { get; private set; } = null!;

    public ICollection<OrganizationMember> Members { get; private set; } = [];
    public ICollection<OrganizationSubscription> Subscriptions { get; private set; } = [];
    public ICollection<PaymentMethod> PaymentMethods { get; private set; } = [];
    public ICollection<Course> Courses { get; private set; } = [];
    public ICollection<Class> Classes { get; private set; } = [];

    public void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Organization name is required.", nameof(name));

        Name = name.Trim();
        AuditState.UpdateAudit();
    }
}
