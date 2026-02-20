using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class GradeScaleConfiguration : IEntityTypeConfiguration<GradeScale>
{
    public void Configure(EntityTypeBuilder<GradeScale> builder)
    {
        builder.HasKey(gs => gs.Id);

        builder.OwnsOne(gs => gs.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(gs => gs.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(gs => new { gs.OrganizationId, gs.Name });

        builder.HasMany(gs => gs.Items)
            .WithOne(gsi => gsi.GradeScale)
            .HasForeignKey(gsi => gsi.GradeScaleId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
