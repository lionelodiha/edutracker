using EduTracker.Domain.Entities;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class PortalInviteConfiguration : IEntityTypeConfiguration<PortalInvite>
{
    public void Configure(EntityTypeBuilder<PortalInvite> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.OrganizationId).IsRequired();
        builder.Property(p => p.Email).IsRequired().HasMaxLength(254);
        builder.Property(p => p.EmailHash).IsRequired().HasMaxLength(32);
        
        builder.Property(p => p.Role)
            .HasConversion<string>()
            .HasMaxLength(OrganizationLimits.MemberRoleMaxLength)
            .IsRequired();

        builder.Property(p => p.TokenHash).IsRequired().HasMaxLength(32);
        builder.Property(p => p.InvitedByUserId).IsRequired();
        builder.Property(p => p.ExpiresAt).IsRequired();
        builder.Property(p => p.ConsumedAt);
        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired();

        builder.HasOne(p => p.Organization)
            .WithMany()
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(p => p.InvitedByUser)
            .WithMany()
            .HasForeignKey(p => p.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        // Unique constraint: (organization_id, email_hash) where consumed_at is null
        builder.HasIndex(p => new { p.OrganizationId, p.EmailHash })
            .IsUnique()
            .HasFilter("consumed_at IS NULL");

        builder.HasIndex(p => p.Email);
    }
}
