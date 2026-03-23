using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class CourseOfferingConfiguration : IEntityTypeConfiguration<CourseOffering>
{
    public void Configure(EntityTypeBuilder<CourseOffering> builder)
    {
        builder.HasKey(co => co.Id);

        builder.OwnsOne(co => co.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.HasOne(co => co.Term)
            .WithMany()
            .HasForeignKey(co => co.TermId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(co => co.Course)
            .WithMany()
            .HasForeignKey(co => co.CourseId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(co => new { co.TermId, co.CourseId })
            .IsUnique();
    }
}
