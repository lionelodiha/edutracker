using EduTracker.Common.Entities;
using EduTracker.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EntityUser = EduTracker.Entities.User;

namespace EduTracker.Configurations.Entities;

public class UserConfiguration : IEntityTypeConfiguration<EntityUser>
{
    public void Configure(EntityTypeBuilder<EntityUser> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.UserName)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(u => u.UserName)
            .IsUnique();

        builder.Property(u => u.EmailHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(u => u.EmailHash)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(60);

        builder.OwnsOne<AuditableDataHandler>(EntityUser.Audit, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.OwnsOne<SensitiveDataHandler<UserSensitive>>(EntityUser.Sensitive, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName("Data")
                .IsRequired();

            sensitive.Ignore(s => s.SensitiveData);
        });
    }
}
