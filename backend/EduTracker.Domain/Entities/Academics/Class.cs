using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Entities.Academics;

public sealed class Class : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Class() { }

    public Class(Guid courseOfferingId, string code, Guid? instructorId, int maxCapacity)
    {
        CourseOfferingId = courseOfferingId;
        Code = code;
        InstructorId = instructorId;
        MaxCapacity = maxCapacity;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid CourseOfferingId { get; private set; }
    public CourseOffering CourseOffering { get; private set; } = null!;

    public string Code { get; private set; } = string.Empty;
    public int MaxCapacity { get; private set; }

    public Guid? InstructorId { get; private set; }
    public User? Instructor { get; private set; }
}
