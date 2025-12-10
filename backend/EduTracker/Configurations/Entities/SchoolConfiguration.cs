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
