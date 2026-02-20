using EduTracker.Domain.Entities.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasKey(o => o.Id);

        builder.HasIndex(o => o.Name);

        builder.HasIndex(o => o.Slug)
            .IsUnique();

        builder.OwnsOne(o => o.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(o => o.Name)
            .HasMaxLength(OrganizationLimits.NameMaxLength)
            .IsRequired();

        builder.Property(o => o.Slug)
            .HasMaxLength(OrganizationLimits.SlugMaxLength)
            .IsRequired();

        builder.Property(o => o.IsActive)
            .IsRequired();

        builder.Property(o => o.OwnerUserId)
            .IsRequired();

        builder.HasOne(o => o.OwnerUser)
            .WithMany()
            .HasForeignKey(o => o.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasMany(o => o.Members)
            .WithOne(m => m.Organization)
            .HasForeignKey(m => m.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(o => o.Subscriptions)
            .WithOne(s => s.Organization)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(o => o.PaymentMethods)
            .WithOne(p => p.Organization)
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(o => o.Roles)
            .WithOne(r => r.Organization)
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Permissions)
            .WithOne(p => p.Organization)
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.AcademicYears)
            .WithOne(ay => ay.Organization)
            .HasForeignKey(ay => ay.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(o => o.Courses)
            .WithOne(c => c.Organization)
            .HasForeignKey(c => c.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(o => o.Classes)
            .WithOne(c => c.Organization)
            .HasForeignKey(c => c.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(o => o.GradingSchemes)
            .WithOne(gs => gs.Organization)
            .HasForeignKey(gs => gs.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();
    }
}
