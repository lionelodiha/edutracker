using EduTracker.Common.Entities;
using EduTracker.Entities;
using EduTracker.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Configurations.Entities;

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.HasKey(us => us.Id);

        builder.HasIndex(us => us.UserId);

        builder.Property(us => us.UserId)
            .IsRequired();

        builder.HasOne(us => us.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(us => us.UserId)
            .IsRequired();

        builder.HasIndex(us => us.ExpiresAt);

        builder.Property(us => us.ExpiresAt)
            .IsRequired();

        builder.Property(us => us.Revoked)
            .IsRequired();

        builder.Property(us => us.DeviceType)
            .HasConversion<string>()
            .IsRequired();

        builder.OwnsOne<AuditableDataHandler>(User.Audit, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.OwnsOne<SensitiveDataHandler<UserSessionSensitive>>(User.Sensitive, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName("Data")
                .IsRequired();

            sensitive.Ignore(s => s.SensitiveData);
        });
    }
}
