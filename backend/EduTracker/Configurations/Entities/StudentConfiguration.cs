using EduTracker.Common.Entities;
using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.MatricNo).HasMaxLength(60);
        // builder.Property(e => e.Status).IsRequired().HasMaxLength(40);
        // builder.HasOne(e => e.User).WithOne().HasForeignKey<Student>(e => e.UserId);
        // builder.HasOne(e => e.School).WithMany(s => s.Students).HasForeignKey(e => e.SchoolId);
        // builder.HasIndex(e => new { e.SchoolId, e.MatricNo }).IsUnique(false);
        builder.OwnsOne<AuditableDataHandler>(nameof(Student.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}
