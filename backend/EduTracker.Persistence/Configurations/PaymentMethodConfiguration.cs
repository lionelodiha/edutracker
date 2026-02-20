using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethod>
{
    public void Configure(EntityTypeBuilder<PaymentMethod> builder)
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

        builder.Property(p => p.Provider)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(p => p.ProviderCustomerId)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.ProviderPaymentMethodId)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Last4)
            .HasMaxLength(4)
            .IsRequired();

        builder.Property(p => p.Brand)
            .HasMaxLength(50);

        builder.Property(p => p.ExpMonth)
            .IsRequired();

        builder.Property(p => p.ExpYear)
            .IsRequired();

        builder.Property(p => p.IsDefault)
            .IsRequired();
    }
}
