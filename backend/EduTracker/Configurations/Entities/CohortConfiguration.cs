using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class CohortConfiguration : IEntityTypeConfiguration<Cohort>
{
    public void Configure(EntityTypeBuilder<Cohort> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(120);

        // builder.HasOne(e => e.School)
        //     .WithMany(s => s.Cohorts)
        //     .HasForeignKey(e => e.SchoolId);

        // builder.HasOne(e => e.Course)
        //     .WithMany(c => c.Cohorts)
        //     .HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.NoAction);

        // builder.HasOne(e => e.AcademicYear)
        //     .WithMany(y => y.Cohorts)
        //     .HasForeignKey(e => e.AcademicYearId);    // ONLY cascade here
    }
}
