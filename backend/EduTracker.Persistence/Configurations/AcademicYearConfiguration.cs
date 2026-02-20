using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.HasKey(ay => ay.Id);

        builder.OwnsOne(ay => ay.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(ay => ay.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(ay => ay.StartUtc)
            .IsRequired();

        builder.Property(ay => ay.EndUtc)
            .IsRequired();

        builder.Property(ay => ay.IsActive)
            .IsRequired();

        builder.HasIndex(ay => new { ay.OrganizationId, ay.Name });

        builder.HasMany(ay => ay.Semesters)
            .WithOne(s => s.AcademicYear)
            .HasForeignKey(s => s.AcademicYearId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(ay => ay.ClassOfferings)
            .WithOne(co => co.AcademicYear)
            .HasForeignKey(co => co.AcademicYearId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
