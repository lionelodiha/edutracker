using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class AcademicTermConfiguration : IEntityTypeConfiguration<AcademicTerm>
{
    public void Configure(EntityTypeBuilder<AcademicTerm> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).IsRequired().HasMaxLength(40);
        builder.Property(e => e.StartsOn).IsRequired();
        builder.Property(e => e.EndsOn).IsRequired();

        // builder.HasIndex(e => new { e.AcademicYearId, e.Name }).IsUnique();

        // builder.HasOne(e => e.AcademicYear)
        //        .WithMany(y => y.Terms)
        //        .HasForeignKey(e => e.AcademicYearId);

    }
}
