using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationInviteConfiguration : IEntityTypeConfiguration<OrganizationInvite>
{
    public void Configure(EntityTypeBuilder<OrganizationInvite> builder)
    {
        builder.HasKey(i => i.Id);

        builder.OwnsOne(i => i.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(i => i.OrganizationId)
            .IsRequired();

        builder.HasOne(i => i.Organization)
            .WithMany()
            .HasForeignKey(i => i.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.Property(i => i.InvitedUserId)
            .IsRequired();

        builder.HasOne(i => i.InvitedUser)
            .WithMany()
            .HasForeignKey(i => i.InvitedUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.Property(i => i.InvitedByUserId)
            .IsRequired();

        builder.HasOne(i => i.InvitedByUser)
            .WithMany()
            .HasForeignKey(i => i.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(OrganizationLimits.InviteStatusMaxLength)
            .IsRequired();

        builder.Property(i => i.ExpiresAt)
            .IsRequired();

        builder.HasIndex(i => new { i.OrganizationId, i.InvitedUserId })
            .IsUnique()
            .HasFilter("status = 'Pending'");

        builder.HasIndex(i => new { i.InvitedUserId, i.Status });
        builder.HasIndex(i => new { i.OrganizationId, i.Status });
    }
}
