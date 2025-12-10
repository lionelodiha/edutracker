using EduTracker.Common.Entities;
using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class AssessmentConfiguration : IEntityTypeConfiguration<Assessment>
{
    public void Configure(EntityTypeBuilder<Assessment> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.Title).IsRequired().HasMaxLength(200);
        // builder.Property(e => e.MaxScore).IsRequired();
        // builder.HasOne(e => e.CohortSubject).WithMany(cs => cs.Assessments).HasForeignKey(e => new { e.CohortId, e.SubjectId });
        builder.OwnsOne<AuditableDataHandler>(nameof(Assessment.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}
