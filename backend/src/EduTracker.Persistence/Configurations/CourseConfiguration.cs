using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(c => c.Name)
            .HasMaxLength(AcademicLimits.CourseNameMaxLength)
            .IsRequired();

        builder.Property(c => c.Code)
            .HasMaxLength(AcademicLimits.CourseCodeMaxLength)
            .IsRequired();

        builder.HasIndex(c => new { c.OrganizationId, c.Code })
            .IsUnique();

        builder.HasOne(c => c.Organization)
            .WithMany()
            .HasForeignKey(c => c.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);
    }
}
