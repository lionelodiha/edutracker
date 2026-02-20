using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class ClassOfferingConfiguration : IEntityTypeConfiguration<ClassOffering>
{
    public void Configure(EntityTypeBuilder<ClassOffering> builder)
    {
        builder.HasKey(co => co.Id);

        builder.OwnsOne(co => co.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.HasIndex(co => new { co.AcademicYearId, co.ClassId });

        builder.HasOne(co => co.Class)
            .WithMany(c => c.Offerings)
            .HasForeignKey(co => co.ClassId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(co => co.Course)
            .WithMany(c => c.ClassOfferings)
            .HasForeignKey(co => co.CourseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(co => co.AssignedTeacher)
            .WithMany()
            .HasForeignKey(co => co.AssignedTeacherId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(co => co.GradingScheme)
            .WithMany(gs => gs.ClassOfferings)
            .HasForeignKey(co => co.GradingSchemeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(co => co.Enrollments)
            .WithOne(e => e.ClassOffering)
            .HasForeignKey(e => e.ClassOfferingId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(co => co.Assessments)
            .WithOne(a => a.ClassOffering)
            .HasForeignKey(a => a.ClassOfferingId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
