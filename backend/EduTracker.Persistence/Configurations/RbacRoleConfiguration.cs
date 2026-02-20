using EduTracker.Domain.Entities.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class RbacRoleConfiguration : IEntityTypeConfiguration<RbacRole>
{
    public void Configure(EntityTypeBuilder<RbacRole> builder)
    {
        builder.HasKey(r => r.Id);

        builder.OwnsOne(r => r.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(r => r.Key)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(r => r.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(r => r.Description)
            .HasMaxLength(500);

        builder.Property(r => r.IsSystem)
            .IsRequired();

        builder.Property(r => r.IsActive)
            .IsRequired();

        builder.HasIndex(r => r.Key)
            .IsUnique();

        builder.HasIndex(r => r.OrganizationId);

        builder.HasMany(r => r.Permissions)
            .WithOne(rp => rp.Role)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(r => r.OrganizationMemberAssignments)
            .WithOne(a => a.Role)
            .HasForeignKey(a => a.RoleId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(r => r.UserAssignments)
            .WithOne(a => a.Role)
            .HasForeignKey(a => a.RoleId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
