using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasKey(o => o.Id);

        builder.OwnsOne(o => o.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(o => o.Name)
            .HasMaxLength(OrganizationLimits.NameMaxLength)
            .IsRequired();

        builder.HasIndex(o => o.Name);

        builder.Property(o => o.IsLocked)
            .IsRequired();

        builder.Property(o => o.OwnerUserId)
            .IsRequired();

        builder.HasOne(o => o.OwnerUser)
            .WithMany()
            .HasForeignKey(o => o.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasIndex(o => o.OwnerUserId);
    }
}
