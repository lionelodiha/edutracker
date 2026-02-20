using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class GradeScaleItemConfiguration : IEntityTypeConfiguration<GradeScaleItem>
{
    public void Configure(EntityTypeBuilder<GradeScaleItem> builder)
    {
        builder.HasKey(gsi => gsi.Id);

        builder.OwnsOne(gsi => gsi.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(gsi => gsi.Letter)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(gsi => gsi.Min)
            .IsRequired();

        builder.Property(gsi => gsi.Max)
            .IsRequired();

        builder.Property(gsi => gsi.Points)
            .IsRequired();

        builder.HasIndex(gsi => new { gsi.GradeScaleId, gsi.Letter });
    }
}
