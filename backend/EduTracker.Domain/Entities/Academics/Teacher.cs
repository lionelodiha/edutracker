using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Teacher : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Teacher() { }

    public Teacher(Guid organizationId, Guid organizationMemberId, string staffId)
    {
        OrganizationId = organizationId;
        OrganizationMemberId = organizationMemberId;
        StaffId = ValidateStaffId(staffId);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid OrganizationMemberId { get; private set; }
    public OrganizationMember OrganizationMember { get; private set; } = null!;

    public string StaffId { get; private set; } = string.Empty;

    public void UpdateStaffId(string staffId)
    {
        string validatedStaffId = ValidateStaffId(staffId);

        if (StaffId == validatedStaffId)
            return;

        StaffId = validatedStaffId;
        AuditState.UpdateAudit();
    }

    private static string ValidateStaffId(string staffId)
    {
        if (string.IsNullOrWhiteSpace(staffId))
            throw new ArgumentException("Staff ID is required.", nameof(staffId));

        string normalizedStaffId = staffId.Trim().ToUpperInvariant();

        if (normalizedStaffId.Length < AcademicLimits.TeacherStaffIdMinLength || normalizedStaffId.Length > AcademicLimits.TeacherStaffIdMaxLength)
            throw new ArgumentException(
                $"Staff ID must be between {AcademicLimits.TeacherStaffIdMinLength} and {AcademicLimits.TeacherStaffIdMaxLength} characters.",
                nameof(staffId)
            );

        if (!AcademicLimits.TeacherStaffIdRegex().IsMatch(normalizedStaffId))
            throw new ArgumentException(
                "Staff ID can only contain uppercase letters, numbers, hyphens, and underscores.",
                nameof(staffId)
            );

        return normalizedStaffId;
    }
}
