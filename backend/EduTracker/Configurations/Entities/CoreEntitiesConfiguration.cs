using EduTracker.Common.Entities;
using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

// Consolidated configurations for brevity; can be split per-entity later
public class SchoolConfiguration : IEntityTypeConfiguration<School>
{
    public void Configure(EntityTypeBuilder<School> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Slug).IsRequired().HasMaxLength(120);
        builder.HasIndex(e => e.Slug).IsUnique();
        builder.OwnsOne<AuditableDataHandler>(nameof(School.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.MatricNo).HasMaxLength(60);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(40);
        builder.HasOne(e => e.User).WithOne().HasForeignKey<Student>(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.School).WithMany(s => s.Students).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.SchoolId, e.MatricNo }).IsUnique(false);
        builder.OwnsOne<AuditableDataHandler>(nameof(Student.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}

public class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
{
    public void Configure(EntityTypeBuilder<Teacher> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.StaffNo).HasMaxLength(60);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(40);
        builder.HasOne(e => e.User).WithOne().HasForeignKey<Teacher>(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.School).WithMany(s => s.Teachers).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.SchoolId, e.StaffNo }).IsUnique(false);
        builder.OwnsOne<AuditableDataHandler>(nameof(Teacher.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Code).IsRequired().HasMaxLength(40);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.HasIndex(e => new { e.SchoolId, e.Code }).IsUnique();
        builder.HasOne(e => e.School).WithMany(s => s.Subjects).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Code).IsRequired().HasMaxLength(40);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.HasIndex(e => new { e.SchoolId, e.Code }).IsUnique();
        builder.HasOne(e => e.School).WithMany(s => s.Courses).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CohortConfiguration : IEntityTypeConfiguration<Cohort>
{
    public void Configure(EntityTypeBuilder<Cohort> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(120);
        builder.HasOne(e => e.School).WithMany(s => s.Cohorts).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Course).WithMany(c => c.Cohorts).HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.AcademicYear).WithMany().HasForeignKey(e => e.AcademicYearId);
    }
}

public class CohortSubjectConfiguration : IEntityTypeConfiguration<CohortSubject>
{
    public void Configure(EntityTypeBuilder<CohortSubject> builder)
    {
        builder.HasKey(e => new { e.CohortId, e.SubjectId });
        builder.HasOne(e => e.Cohort).WithMany(c => c.CohortSubjects).HasForeignKey(e => e.CohortId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Subject).WithMany(s => s.CohortSubjects).HasForeignKey(e => e.SubjectId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Teacher).WithMany(t => t.AssignedSubjects).HasForeignKey(e => e.TeacherId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class AssessmentConfiguration : IEntityTypeConfiguration<Assessment>
{
    public void Configure(EntityTypeBuilder<Assessment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Title).IsRequired().HasMaxLength(200);
        builder.Property(e => e.MaxScore).IsRequired();
        builder.HasOne(e => e.CohortSubject).WithMany(cs => cs.Assessments).HasForeignKey(e => new { e.CohortId, e.SubjectId }).OnDelete(DeleteBehavior.Cascade);
        builder.OwnsOne<AuditableDataHandler>(nameof(Assessment.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}

public class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Letter).IsRequired().HasMaxLength(2);
        builder.Property(e => e.MinScore).IsRequired();
        builder.Property(e => e.MaxScore).IsRequired();
        builder.HasIndex(e => new { e.SchoolId, e.Letter }).IsUnique();
        builder.HasOne(e => e.School).WithMany(s => s.Grades).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Topic).HasMaxLength(200);
        builder.HasOne(e => e.CohortSubject).WithMany(cs => cs.Sessions).HasForeignKey(e => new { e.CohortId, e.SubjectId }).OnDelete(DeleteBehavior.Cascade);
        builder.Property(e => e.StartsAt).IsRequired();
        builder.Property(e => e.EndsAt).IsRequired();
    }
}

public class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(40);
        builder.Property(e => e.StartsOn).IsRequired();
        builder.Property(e => e.EndsOn).IsRequired();
        builder.HasIndex(e => new { e.SchoolId, e.Name }).IsUnique();
        builder.HasOne(e => e.School).WithMany(s => s.AcademicYears).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class AcademicTermConfiguration : IEntityTypeConfiguration<AcademicTerm>
{
    public void Configure(EntityTypeBuilder<AcademicTerm> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(40);
        builder.Property(e => e.StartsOn).IsRequired();
        builder.Property(e => e.EndsOn).IsRequired();
        builder.HasIndex(e => new { e.SchoolId, e.Name, e.AcademicYearId }).IsUnique();
        builder.HasOne(e => e.School).WithMany().HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.AcademicYear).WithMany(y => y.Terms).HasForeignKey(e => e.AcademicYearId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class BillingPlanConfiguration : IEntityTypeConfiguration<BillingPlan>
{
    public void Configure(EntityTypeBuilder<BillingPlan> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(80);
        builder.Property(e => e.Price).HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.Interval).IsRequired().HasMaxLength(20);
    }
}

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.School).WithMany(s => s.Subscriptions).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.BillingPlan).WithMany().HasForeignKey(e => e.BillingPlanId).OnDelete(DeleteBehavior.Restrict);
        builder.Property(e => e.StartsOn).IsRequired();
        builder.Property(e => e.EndsOn).IsRequired(false);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(30);
    }
}

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.School).WithMany(s => s.PaymentTransactions).HasForeignKey(e => e.SchoolId).OnDelete(DeleteBehavior.Cascade);
        builder.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.Currency).IsRequired().HasMaxLength(3);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(30);
        builder.HasIndex(e => e.Reference).IsUnique();
    }
}
