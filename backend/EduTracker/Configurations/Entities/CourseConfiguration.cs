using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.Code).IsRequired().HasMaxLength(40);
        // builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        // builder.HasIndex(e => new { e.SchoolId, e.Code }).IsUnique();
        // builder.HasOne(e => e.School).WithMany(s => s.Courses).HasForeignKey(e => e.SchoolId);
    }
}
