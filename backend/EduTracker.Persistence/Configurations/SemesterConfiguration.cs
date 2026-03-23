using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
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
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(s => s.StartYear)
            .IsRequired();

        builder.HasOne(s => s.Organization)
            .WithMany()
            .HasForeignKey(s => s.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => new { s.OrganizationId, s.StartYear })
            .IsUnique();
    }
}