using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class SemesterConfiguration : IEntityTypeConfiguration<Semester>
{
    public void Configure(EntityTypeBuilder<Semester> builder)
    {
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Session).HasMaxLength(9).IsRequired();

        builder.HasOne<Organization>()
            .WithMany()
            .HasForeignKey(s => s.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(s => new { s.OrganizationId, s.Session }).IsUnique();
        
        builder.OwnsOne(s => s.AuditState);
    }
}
