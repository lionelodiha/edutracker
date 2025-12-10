using EduTracker.Common.Entities;
using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
{
    public void Configure(EntityTypeBuilder<Teacher> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.StaffNo).HasMaxLength(60);
        // builder.Property(e => e.Status).IsRequired().HasMaxLength(40);
        // builder.HasOne(e => e.User).WithOne().HasForeignKey<Teacher>(e => e.UserId);
        // builder.HasOne(e => e.School).WithMany(s => s.Teachers).HasForeignKey(e => e.SchoolId);
        // builder.HasIndex(e => new { e.SchoolId, e.StaffNo }).IsUnique(false);
        builder.OwnsOne<AuditableDataHandler>(nameof(Teacher.Audit), audit =>
        {
            audit.Property(a => a.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            audit.Property(a => a.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}
