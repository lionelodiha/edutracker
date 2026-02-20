using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Class : IEntity, IAuditable
{
    public readonly AuditState AuditState = new();

    private Class() { }

    public Class(Guid organizationId, Guid courseId, Guid teacherMemberId, string term, int year)
    {
        if (string.IsNullOrWhiteSpace(term))
            throw new ArgumentException("Term is required.", nameof(term));

        if (year < 2000)
            throw new ArgumentOutOfRangeException(nameof(year), "Year is invalid.");

        OrganizationId = organizationId;
        CourseId = courseId;
        TeacherMemberId = teacherMemberId;
        Term = term.Trim();
        Year = year;
        Name = $"{Term} {Year}";
        Active = true;

        AuditState.UpdateAudit();
    }

    public Class(Guid organizationId, string name, string? level = null, string? stream = null, bool active = true)
    {
        OrganizationId = organizationId;
        SetName(name);
        Level = string.IsNullOrWhiteSpace(level) ? null : level.Trim();
        Stream = string.IsNullOrWhiteSpace(stream) ? null : stream.Trim();
        Active = active;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid CourseId { get; private set; }
    public Course Course { get; private set; } = null!;

    public Guid TeacherMemberId { get; private set; }
    public OrganizationMember TeacherMember { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public string? Level { get; private set; }
    public string? Stream { get; private set; }
    public bool Active { get; private set; } = true;

    public string Term { get; private set; } = string.Empty;
    public int Year { get; private set; }

    public ICollection<ClassEnrollment> Enrollments { get; private set; } = [];
    public ICollection<Assignment> Assignments { get; private set; } = [];
    public ICollection<ClassOffering> Offerings { get; private set; } = [];

    public void UpdateTeacher(Guid teacherMemberId)
    {
        TeacherMemberId = teacherMemberId;
        AuditState.UpdateAudit();
    }

    public void SetName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Class name is required.", nameof(newName));

        Name = newName.Trim();
        AuditState.UpdateAudit();
    }

    public void UpdateProfile(string name, string? level, string? stream)
    {
        SetName(name);
        Level = string.IsNullOrWhiteSpace(level) ? null : level.Trim();
        Stream = string.IsNullOrWhiteSpace(stream) ? null : stream.Trim();
        AuditState.UpdateAudit();
    }

    public void SetActive(bool active)
    {
        if (Active == active) return;

        Active = active;
        AuditState.UpdateAudit();
    }
}
