using EduTracker.Domain.Entities.Billing;
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

        builder.OwnsOne(p => p.SensitiveDataState, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName("Data")
                .IsRequired();

            sensitive.Ignore(s => s.SensitiveData);
        });

        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        builder.Property(p => p.IsActive)
            .IsRequired();

        builder.HasIndex(p => p.Name)
            .IsUnique();
    }
}
