using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.OwnsOne(a => a.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
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

        builder.Property(a => a.DueDate);
        builder.Property(a => a.DueAtUtc);
        builder.Property(a => a.IsPublished);

        builder.HasIndex(a => a.ClassId);
        builder.HasIndex(a => a.ClassOfferingId);

        builder.HasOne(a => a.Class)
            .WithMany(c => c.Assignments)
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(a => a.ClassOffering)
            .WithMany()
            .HasForeignKey(a => a.ClassOfferingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.GradingComponent)
            .WithMany()
            .HasForeignKey(a => a.GradingComponentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
