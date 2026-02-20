using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class SemesterConfiguration : IEntityTypeConfiguration<Semester>
{
    public void Configure(EntityTypeBuilder<Semester> builder)
    {
        builder.HasKey(s => s.Id);

        builder.OwnsOne(s => s.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(s => s.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.Order)
            .IsRequired();

        builder.Property(s => s.StartUtc)
            .IsRequired();

        builder.Property(s => s.EndUtc)
            .IsRequired();

        builder.HasIndex(s => new { s.AcademicYearId, s.Order });

        builder.HasMany(s => s.ClassOfferings)
            .WithOne(co => co.Semester)
            .HasForeignKey(co => co.SemesterId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
