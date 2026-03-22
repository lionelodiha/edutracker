using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class CourseOfferingConfiguration : IEntityTypeConfiguration<CourseOffering>
{
    public void Configure(EntityTypeBuilder<CourseOffering> builder)
    {
        builder.HasKey(co => co.Id);
        
        builder.HasOne(co => co.Course)
            .WithMany()
            .HasForeignKey(co => co.CourseId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(co => co.Semester)
            .WithMany()
            .HasForeignKey(co => co.SemesterId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(co => co.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(co => new { co.SemesterId, co.CourseId }).IsUnique();
        
        builder.OwnsOne(co => co.AuditState);
    }
}
