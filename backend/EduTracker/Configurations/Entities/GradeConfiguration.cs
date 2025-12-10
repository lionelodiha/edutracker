using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.Letter).IsRequired().HasMaxLength(2);
        // builder.Property(e => e.MinScore).IsRequired();
        // builder.Property(e => e.MaxScore).IsRequired();
        // builder.HasIndex(e => new { e.SchoolId, e.Letter }).IsUnique();
        // builder.HasOne(e => e.School).WithMany(s => s.Grades).HasForeignKey(e => e.SchoolId);
    }
}
