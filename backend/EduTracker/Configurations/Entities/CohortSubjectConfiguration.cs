using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class CohortSubjectConfiguration : IEntityTypeConfiguration<CohortSubject>
{
    public void Configure(EntityTypeBuilder<CohortSubject> builder)
    {
        builder.HasKey(e => new { e.CohortId, e.SubjectId });
        // builder.HasOne(e => e.Cohort).WithMany(c => c.CohortSubjects).HasForeignKey(e => e.CohortId);
        // builder.HasOne(e => e.Subject).WithMany(s => s.CohortSubjects).HasForeignKey(e => e.SubjectId);
        // builder.HasOne(e => e.Teacher).WithMany(t => t.AssignedSubjects).HasForeignKey(e => e.TeacherId);
    }
}
