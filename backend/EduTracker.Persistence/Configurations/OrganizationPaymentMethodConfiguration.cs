using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationPaymentMethodConfiguration : IEntityTypeConfiguration<OrganizationPaymentMethod>
{
    public void Configure(EntityTypeBuilder<OrganizationPaymentMethod> builder)
    {
        builder.HasKey(p => p.Id);

        builder.OwnsOne(p => p.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();
        });

        builder.OwnsOne(p => p.SensitiveDataState, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName("Data")
                .IsRequired();

            sensitive.Ignore(s => s.SensitiveData);
        });

        builder.Property(p => p.OrganizationId)
            .IsRequired();

        builder.HasOne(p => p.Organization)
            .WithMany()
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.Property(p => p.Provider)
            .HasMaxLength(OrganizationLimits.ProviderMaxLength)
            .IsRequired();

        builder.Property(p => p.Brand)
            .HasMaxLength(OrganizationLimits.BrandMaxLength)
            .IsRequired();

        builder.Property(p => p.IsDefault)
            .IsRequired();

        builder.HasIndex(p => p.OrganizationId);
        builder.HasIndex(p => new { p.OrganizationId, p.IsDefault });
    }
}
