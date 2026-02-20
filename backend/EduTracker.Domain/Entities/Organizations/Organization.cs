using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Billing;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Organizations;

public sealed class Organization : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Organization() { }

    public Organization(string name, Guid ownerUserId)
    {
        OwnerUserId = ownerUserId;

        SetName(name);
        SetSlug(CreateDefaultSlug(name));
        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    public Guid OwnerUserId { get; private set; }
    public User OwnerUser { get; private set; } = null!;

    public ICollection<OrganizationMember> Members { get; private set; } = [];

    public ICollection<OrganizationSubscription> Subscriptions { get; private set; } = [];
    public ICollection<PaymentMethod> PaymentMethods { get; private set; } = [];
    public ICollection<RbacRole> Roles { get; private set; } = [];
    public ICollection<RbacPermission> Permissions { get; private set; } = [];
    public ICollection<AcademicYear> AcademicYears { get; private set; } = [];
    public ICollection<Course> Courses { get; private set; } = [];
    public ICollection<Class> Classes { get; private set; } = [];
    public ICollection<GradingScheme> GradingSchemes { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Organization name is required.", nameof(newName));

        int length = newName.Length;

        if (length < OrganizationLimits.NameMinLength || length > OrganizationLimits.NameMaxLength)
            throw new ArgumentException(
                $"Name must be between {OrganizationLimits.NameMinLength} and {OrganizationLimits.NameMaxLength} characters.",
                nameof(newName)
            );

        if (!OrganizationLimits.NameRegex().IsMatch(newName))
            throw new ArgumentException("Name contains invalid characters.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void SetSlug(string newSlug)
    {
        if (string.IsNullOrWhiteSpace(newSlug))
            throw new ArgumentException("Organization slug is required.", nameof(newSlug));

        string normalizedSlug = newSlug.Trim().ToLowerInvariant();
        int length = normalizedSlug.Length;

        if (length < OrganizationLimits.SlugMinLength || length > OrganizationLimits.SlugMaxLength)
            throw new ArgumentException(
                $"Slug must be between {OrganizationLimits.SlugMinLength} and {OrganizationLimits.SlugMaxLength} characters.",
                nameof(newSlug)
            );

        if (!OrganizationLimits.SlugRegex().IsMatch(normalizedSlug))
            throw new ArgumentException("Slug contains invalid characters.", nameof(newSlug));

        Slug = normalizedSlug;
        AuditState.UpdateAudit();
    }

    public void Activate()
    {
        if (IsActive) return;

        IsActive = true;
        AuditState.UpdateAudit();
    }

    public void Deactivate()
    {
        if (!IsActive) return;

        IsActive = false;
        AuditState.UpdateAudit();
    }

    private static string CreateDefaultSlug(string name)
    {
        string normalized = name.Trim().ToLowerInvariant();
        Span<char> buffer = stackalloc char[normalized.Length];
        int index = 0;

        for (int i = 0; i < normalized.Length; i++)
        {
            char character = normalized[i];

            if ((character >= 'a' && character <= 'z') || (character >= '0' && character <= '9'))
            {
                buffer[index++] = character;
                continue;
            }

            if (character == ' ' || character == '-')
                buffer[index++] = '-';
        }

        string candidate = new string(buffer[..index]).Trim('-');

        while (candidate.Contains("--", StringComparison.Ordinal))
            candidate = candidate.Replace("--", "-", StringComparison.Ordinal);

        if (candidate.Length < OrganizationLimits.SlugMinLength)
            candidate = $"{candidate}org";

        return candidate;
    }
}
