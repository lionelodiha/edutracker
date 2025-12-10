using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class School : IEntity, IAuditableEntity
{
    internal readonly AuditableDataHandler Audit = new();

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;

    public DateTimeOffset CreatedAt => Audit.CreatedAt;
    public DateTimeOffset UpdatedAt => Audit.UpdatedAt;

    // Navigation
    public ICollection<Student> Students { get; private set; } = new List<Student>();
    public ICollection<Teacher> Teachers { get; private set; } = new List<Teacher>();
    public ICollection<Course> Courses { get; private set; } = new List<Course>();
    public ICollection<Subject> Subjects { get; private set; } = new List<Subject>();
    public ICollection<Cohort> Cohorts { get; private set; } = new List<Cohort>();
    public ICollection<AcademicYear> AcademicYears { get; private set; } = new List<AcademicYear>();
    public ICollection<Grade> Grades { get; private set; } = new List<Grade>();
    public ICollection<Subscription> Subscriptions { get; private set; } = new List<Subscription>();
    public ICollection<PaymentTransaction> PaymentTransactions { get; private set; } = new List<PaymentTransaction>();

    private School() { }
    public School(string name, string slug)
    {
        Name = name;
        Slug = slug;
    }

    public void UpdateAudit() => Audit.UpdateAudit();
}
