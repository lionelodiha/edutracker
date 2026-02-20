using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Semester : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Semester() { }

    public Semester(Guid organizationId, Guid academicYearId, string name, int order, DateTime startUtc, DateTime endUtc)
    {
        if (order <= 0)
            throw new ArgumentOutOfRangeException(nameof(order), "Semester order must be greater than zero.");

        if (endUtc <= startUtc)
            throw new ArgumentException("Semester end must be later than start.", nameof(endUtc));

        OrganizationId = organizationId;
        AcademicYearId = academicYearId;
        SetName(name);
        Order = order;
        StartUtc = startUtc;
        EndUtc = endUtc;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid AcademicYearId { get; private set; }
    public AcademicYear AcademicYear { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public int Order { get; private set; }
    public DateTime StartUtc { get; private set; }
    public DateTime EndUtc { get; private set; }

    public ICollection<ClassOffering> ClassOfferings { get; private set; } = [];

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Semester name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void UpdateOrder(int order)
    {
        if (order <= 0)
            throw new ArgumentOutOfRangeException(nameof(order), "Semester order must be greater than zero.");

        if (Order == order) return;

        Order = order;
        AuditState.UpdateAudit();
    }

    public void UpdatePeriod(DateTime startUtc, DateTime endUtc)
    {
        if (endUtc <= startUtc)
            throw new ArgumentException("Semester end must be later than start.", nameof(endUtc));

        StartUtc = startUtc;
        EndUtc = endUtc;
        AuditState.UpdateAudit();
    }
}
