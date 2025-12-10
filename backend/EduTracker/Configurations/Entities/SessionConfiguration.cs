using EduTracker.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.HasKey(e => e.Id);
        // builder.Property(e => e.Topic).HasMaxLength(200);
        // builder.HasOne(e => e.CohortSubject).WithMany(cs => cs.Sessions).HasForeignKey(e => new { e.CohortId, e.SubjectId });
        // builder.Property(e => e.StartsAt).IsRequired();
        // builder.Property(e => e.EndsAt).IsRequired();
    }
}
