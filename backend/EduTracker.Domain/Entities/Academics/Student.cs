using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Student : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Student() { }

    public Student(Guid organizationId, Guid organizationMemberId, string studentNumber, Guid? classId = null)
    {
        OrganizationId = organizationId;
        OrganizationMemberId = organizationMemberId;
        StudentNumber = ValidateStudentNumber(studentNumber);
        ClassId = classId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Organization Organization { get; private set; } = null!;

    public Guid OrganizationMemberId { get; private set; }
    public OrganizationMember OrganizationMember { get; private set; } = null!;

    public string StudentNumber { get; private set; } = string.Empty;

    public Guid? ClassId { get; private set; }
    public AcademicClass? Class { get; private set; }

    public void UpdateStudentNumber(string studentNumber)
    {
        string validatedStudentNumber = ValidateStudentNumber(studentNumber);

        if (StudentNumber == validatedStudentNumber)
            return;

        StudentNumber = validatedStudentNumber;
        AuditState.UpdateAudit();
    }

    public void AssignClass(Guid? classId)
    {
        if (ClassId == classId)
            return;

        ClassId = classId;
        AuditState.UpdateAudit();
    }

    private static string ValidateStudentNumber(string studentNumber)
    {
        if (string.IsNullOrWhiteSpace(studentNumber))
            throw new ArgumentException("Student number is required.", nameof(studentNumber));

        string normalizedStudentNumber = studentNumber.Trim().ToUpperInvariant();

        if (normalizedStudentNumber.Length < AcademicLimits.StudentNumberMinLength || normalizedStudentNumber.Length > AcademicLimits.StudentNumberMaxLength)
            throw new ArgumentException(
                $"Student number must be between {AcademicLimits.StudentNumberMinLength} and {AcademicLimits.StudentNumberMaxLength} characters.",
                nameof(studentNumber)
            );

        if (!AcademicLimits.StudentNumberRegex().IsMatch(normalizedStudentNumber))
            throw new ArgumentException(
                "Student number can only contain uppercase letters, numbers, hyphens, and underscores.",
                nameof(studentNumber)
            );

        return normalizedStudentNumber;
    }
}
