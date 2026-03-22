using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Name).HasMaxLength(150).IsRequired();
        builder.Property(c => c.Code).HasMaxLength(20).IsRequired();

        builder.HasIndex(c => new { c.OrganizationId, c.Code }).IsUnique();

        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(c => c.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.OwnsOne(c => c.AuditState);
    }
}
