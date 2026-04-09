using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
{
    public void Configure(EntityTypeBuilder<Teacher> builder)
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

        builder.Property(item => item.StaffId)
            .HasMaxLength(AcademicLimits.TeacherStaffIdMaxLength)
            .IsRequired();

        builder.HasIndex(item => item.OrganizationMemberId)
            .IsUnique();

        builder.HasIndex(item => new { item.OrganizationId, item.StaffId })
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
    }
}
