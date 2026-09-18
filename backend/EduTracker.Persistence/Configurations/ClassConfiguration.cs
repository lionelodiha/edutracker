using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class ClassConfiguration : IEntityTypeConfiguration<Class>
{
    public void Configure(EntityTypeBuilder<Class> builder)
    {
        builder.ToTable("Classes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.MaxCapacity)
            .IsRequired();

        builder.HasOne(c => c.CourseOffering)
            .WithMany()
            .HasForeignKey(c => c.CourseOfferingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Instructor)
            .WithMany()
            .HasForeignKey(c => c.InstructorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.OwnsOne(c => c.AuditState, a =>
        {
            a.Property(s => s.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            a.Property(s => s.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });
    }
}
