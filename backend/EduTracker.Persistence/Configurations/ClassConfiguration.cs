using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class ClassConfiguration : IEntityTypeConfiguration<Class>
{
    public void Configure(EntityTypeBuilder<Class> builder)
    {
        builder.HasKey(c => c.Id);

        builder.OwnsOne(c => c.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(c => c.Term)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Year)
            .IsRequired();

        builder.HasIndex(c => new { c.OrganizationId, c.Term, c.Year });
        builder.HasIndex(c => c.CourseId);
        builder.HasIndex(c => c.TeacherMemberId);

        builder.HasOne(c => c.Course)
            .WithMany(c => c.Classes)
            .HasForeignKey(c => c.CourseId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(c => c.TeacherMember)
            .WithMany()
            .HasForeignKey(c => c.TeacherMemberId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();
    }
}
