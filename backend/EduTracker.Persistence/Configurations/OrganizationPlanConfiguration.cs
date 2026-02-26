using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationPlanConfiguration : IEntityTypeConfiguration<OrganizationPlan>
{
    public void Configure(EntityTypeBuilder<OrganizationPlan> builder)
    {
        builder.HasKey(p => p.Id);

        builder.OwnsOne(p => p.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(p => p.Name)
            .HasMaxLength(OrganizationLimits.PlanNameMaxLength)
            .IsRequired();

        builder.HasIndex(p => p.Name)
            .IsUnique();

        builder.Property(p => p.HasAdvancedReports)
            .IsRequired();

        builder.Property(p => p.HasApiAccess)
            .IsRequired();
    }
}
