using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class AcademicClassConfiguration : IEntityTypeConfiguration<AcademicClass>
{
    public void Configure(EntityTypeBuilder<AcademicClass> builder)
    {
        builder.HasKey(item => item.Id);

        builder.OwnsOne(item => item.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(item => item.Name)
            .HasMaxLength(AcademicLimits.ClassNameMaxLength)
            .IsRequired();

        builder.Property(item => item.Code)
            .HasMaxLength(AcademicLimits.ClassCodeMaxLength)
            .IsRequired();

        builder.HasIndex(item => new { item.OrganizationId, item.Code })
            .IsUnique();

        builder.HasOne(item => item.Organization)
            .WithMany()
            .HasForeignKey(item => item.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);
    }
}
