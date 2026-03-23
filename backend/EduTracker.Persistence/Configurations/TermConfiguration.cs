using EduTracker.Domain.Entities.Academics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class TermConfiguration : IEntityTypeConfiguration<Term>
{
    public void Configure(EntityTypeBuilder<Term> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Ordinal).IsRequired();

        builder.HasOne(t => t.Semester)
            .WithMany()
            .HasForeignKey(t => t.SemesterId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => new { t.SemesterId, t.Ordinal }).IsUnique();

        builder.OwnsOne(t => t.AuditState);
    }
}
