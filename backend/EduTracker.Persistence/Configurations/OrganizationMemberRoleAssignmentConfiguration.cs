using EduTracker.Domain.Entities.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationMemberRoleAssignmentConfiguration : IEntityTypeConfiguration<OrganizationMemberRoleAssignment>
{
    public void Configure(EntityTypeBuilder<OrganizationMemberRoleAssignment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.OwnsOne(a => a.AuditState, audit =>
        {
            audit.Property(x => x.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(x => x.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(a => a.AssignedAtUtc)
            .IsRequired();

        builder.Property(a => a.IsActive)
            .IsRequired();

        builder.HasIndex(a => new { a.OrganizationMemberId, a.RoleId });
        builder.HasIndex(a => a.OrganizationMemberId);
    }
}
