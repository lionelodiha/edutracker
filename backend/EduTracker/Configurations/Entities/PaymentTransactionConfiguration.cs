using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.School).WithMany(s => s.PaymentTransactions).HasForeignKey(e => e.SchoolId);
        builder.Property(e => e.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.Currency).IsRequired().HasMaxLength(3);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(30);
        builder.HasIndex(e => e.Reference).IsUnique();
    }
}
