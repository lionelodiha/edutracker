using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class ClassEnrollmentConfiguration : IEntityTypeConfiguration<ClassEnrollment>
{
    public void Configure(EntityTypeBuilder<ClassEnrollment> builder)
    {
        builder.HasKey(e => e.Id);

        builder.OwnsOne(e => e.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(e => e.EnrolledAt)
            .IsRequired();

        builder.HasIndex(e => new { e.ClassId, e.StudentMemberId })
            .IsUnique();

        builder.HasOne(e => e.Class)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.ClassId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(e => e.StudentMember)
            .WithMany()
            .HasForeignKey(e => e.StudentMemberId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();
    }
}
