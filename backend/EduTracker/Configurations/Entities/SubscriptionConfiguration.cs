using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.School).WithMany(s => s.Subscriptions).HasForeignKey(e => e.SchoolId);
        builder.HasOne(e => e.BillingPlan).WithMany().HasForeignKey(e => e.BillingPlanId);
        builder.Property(e => e.StartsOn).IsRequired();
        builder.Property(e => e.EndsOn).IsRequired(false);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(30);
    }
}
