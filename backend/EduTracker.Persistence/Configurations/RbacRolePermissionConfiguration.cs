using EduTracker.Domain.Entities.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class RbacRolePermissionConfiguration : IEntityTypeConfiguration<RbacRolePermission>
{
    public void Configure(EntityTypeBuilder<RbacRolePermission> builder)
    {
        builder.HasKey(rp => rp.Id);

        builder.OwnsOne(rp => rp.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(rp => rp.IsActive)
            .IsRequired();

        builder.Property(rp => rp.GrantedAtUtc)
            .IsRequired();

        builder.HasIndex(rp => new { rp.RoleId, rp.PermissionId })
            .IsUnique();
    }
}
