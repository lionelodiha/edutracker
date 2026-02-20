using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class GradingComponentConfiguration : IEntityTypeConfiguration<GradingComponent>
{
    public void Configure(EntityTypeBuilder<GradingComponent> builder)
    {
        builder.HasKey(gc => gc.Id);

        builder.OwnsOne(gc => gc.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(gc => gc.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(gc => gc.Order)
            .IsRequired();

        builder.Property(gc => gc.WeightPercent)
            .IsRequired();

        builder.Property(gc => gc.MaxScore)
            .IsRequired();

        builder.HasIndex(gc => new { gc.GradingSchemeId, gc.Order });
    }
}
