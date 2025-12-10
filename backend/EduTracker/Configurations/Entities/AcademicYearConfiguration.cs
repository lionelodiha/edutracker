using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.Name).IsRequired().HasMaxLength(40);
        // builder.Property(e => e.StartsOn).IsRequired();
        // builder.Property(e => e.EndsOn).IsRequired();
        // builder.HasIndex(e => new { e.SchoolId, e.Name }).IsUnique();
        // builder.HasOne(e => e.School).WithMany(s => s.AcademicYears).HasForeignKey(e => e.SchoolId);
    }
}
