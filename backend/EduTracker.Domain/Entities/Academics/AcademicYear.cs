using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class AcademicYear : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private AcademicYear() { }

    public AcademicYear(Guid organizationId, string name, DateTime startUtc, DateTime endUtc, bool isActive = false)
    {
        if (endUtc <= startUtc)
            throw new ArgumentException("Academic year end must be later than start.", nameof(endUtc));

        OrganizationId = organizationId;
        SetName(name);
        StartUtc = startUtc;
        EndUtc = endUtc;
        IsActive = isActive;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public DateTime StartUtc { get; private set; }
    public DateTime EndUtc { get; private set; }
    public bool IsActive { get; private set; }

    public ICollection<Semester> Semesters { get; private set; } = [];
    public ICollection<ClassOffering> ClassOfferings { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Academic year name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void UpdatePeriod(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc)
            throw new ArgumentException("Academic year end must be later than start.", nameof(endUtc));

        StartUtc = startUtc;
        EndUtc = endUtc;
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
}
