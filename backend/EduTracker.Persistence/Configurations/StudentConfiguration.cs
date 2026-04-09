using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.HasKey(item => item.Id);

        builder.OwnsOne(item => item.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.Property(item => item.StudentNumber)
            .HasMaxLength(AcademicLimits.StudentNumberMaxLength)
            .IsRequired();

        builder.HasIndex(item => item.OrganizationMemberId)
            .IsUnique();

        builder.HasIndex(item => new { item.OrganizationId, item.StudentNumber })
            .IsUnique();

        builder.HasOne(item => item.Organization)
            .WithMany()
            .HasForeignKey(item => item.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(item => item.OrganizationMember)
            .WithMany()
            .HasForeignKey(item => item.OrganizationMemberId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(item => item.Class)
            .WithMany()
            .HasForeignKey(item => item.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
