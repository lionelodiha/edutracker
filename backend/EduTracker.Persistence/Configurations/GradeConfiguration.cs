using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.HasKey(g => g.Id);

        builder.OwnsOne(g => g.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(g => g.RawScore)
            .IsRequired();

        builder.Property(g => g.Score)
            .IsRequired();

        builder.Property(g => g.GradedAtUtc)
            .IsRequired();

        builder.Property(g => g.GradedAt)
            .IsRequired();

        builder.HasIndex(g => new { g.AssignmentId, g.StudentMemberId })
            .IsUnique();

        builder.HasOne(g => g.Assignment)
            .WithMany(a => a.Grades)
            .HasForeignKey(g => g.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(g => g.Assessment)
            .WithMany(a => a.Grades)
            .HasForeignKey(g => g.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(g => g.Enrollment)
            .WithMany(e => e.Grades)
            .HasForeignKey(g => g.EnrollmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(g => g.StudentMember)
            .WithMany()
            .HasForeignKey(g => g.StudentMemberId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();
    }
}
