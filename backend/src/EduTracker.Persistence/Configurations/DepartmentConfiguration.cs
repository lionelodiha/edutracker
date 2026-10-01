using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.HasKey(d => d.Id);

        builder.OwnsOne(d => d.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(d => d.Name)
            .HasMaxLength(AcademicLimits.DepartmentNameMaxLength)
            .IsRequired();

        builder.Property(d => d.Description)
            .HasMaxLength(AcademicLimits.DepartmentDescriptionMaxLength);

        // A department name must be unique within the organization. Scoped to
        // OrganizationId (not FacultyId): with a nullable FacultyId, Postgres
        // NULLs never equal each other, so a (FacultyId, Name) index would
        // permit unlimited duplicate names.
        builder.HasIndex(d => new { d.OrganizationId, d.Name })
            .IsUnique();

        builder.HasOne(d => d.Faculty)
            .WithMany()
            .HasForeignKey(d => d.FacultyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);   // losing a faculty must not delete departments

        builder.HasOne(d => d.Organization)
            .WithMany()
            .HasForeignKey(d => d.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
    }
}
