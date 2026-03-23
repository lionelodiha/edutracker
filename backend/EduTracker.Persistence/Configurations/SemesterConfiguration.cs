using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class SemesterConfiguration : IEntityTypeConfiguration<Semester>
{
    public void Configure(EntityTypeBuilder<Semester> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.StartYear).IsRequired();

        builder.Ignore(s => s.EndYear);
        builder.Ignore(s => s.Session);

        builder.HasOne(s => s.Organization)
            .WithMany()
            .HasForeignKey(s => s.OrganizationId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.OrganizationId, s.StartYear }).IsUnique();

        builder.OwnsOne(s => s.AuditState);
    }
}
