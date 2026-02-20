using EduTracker.Domain.Entities.Billing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationSubscriptionConfiguration : IEntityTypeConfiguration<OrganizationSubscription>
{
    public void Configure(EntityTypeBuilder<OrganizationSubscription> builder)
    {
        builder.HasKey(s => s.Id);

        builder.OwnsOne(s => s.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(s => s.Plan)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(s => s.BillingCycle)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(s => s.StartUtc)
            .IsRequired();

        builder.Property(s => s.EndUtc)
            .IsRequired();

        builder.Property(s => s.TrialEndsUtc);

        builder.Property(s => s.RenewAuto)
            .IsRequired();

        builder.Ignore(s => s.CurrentPeriodStart);
        builder.Ignore(s => s.CurrentPeriodEnd);
        builder.Ignore(s => s.TrialEndsAt);

        builder.HasIndex(s => new { s.OrganizationId, s.Status });

        builder.HasOne(s => s.OwnerUser)
            .WithMany()
            .HasForeignKey(s => s.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(s => s.PlanCatalog)
            .WithMany(p => p.Subscriptions)
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
