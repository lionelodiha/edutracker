using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class AssessmentConfiguration : IEntityTypeConfiguration<Assessment>
{
    public void Configure(EntityTypeBuilder<Assessment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.OwnsOne(a => a.AuditState, audit =>
        {
            audit.Property(x => x.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(x => x.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(a => a.Title)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(a => a.MaxScore)
            .IsRequired();

        builder.Property(a => a.AssignedAtUtc)
            .IsRequired();

        builder.Property(a => a.IsPublished)
            .IsRequired();

        builder.HasIndex(a => a.ClassOfferingId);

        builder.HasOne(a => a.GradingComponent)
            .WithMany(gc => gc.Assessments)
            .HasForeignKey(a => a.GradingComponentId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
