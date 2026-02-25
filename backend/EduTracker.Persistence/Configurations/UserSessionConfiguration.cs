using EduTracker.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.HasKey(us => us.Id);

        builder.OwnsOne(us => us.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.Property(us => us.UserId)
            .IsRequired();

        builder.HasOne(us => us.User)
            .WithMany()
            .HasForeignKey(us => us.UserId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasIndex(us => us.UserId);

        builder.HasIndex(us => new { us.UserId, us.IsRevoked });

        builder.Property(us => us.RememberMe)
            .IsRequired();

        builder.Property(us => us.IsRevoked)
            .IsRequired();

        builder.Property(us => us.ExpiresAt)
            .IsRequired();

        builder.HasIndex(us => us.ExpiresAt);

        builder.Property(us => us.AbsoluteExpiresAt)
            .IsRequired();
    }
}
