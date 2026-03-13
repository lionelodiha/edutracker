using EduTracker.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.OwnsOne(u => u.AuditState, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();
        });

        builder.OwnsOne(u => u.SensitiveDataState, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName("Data")
                .IsRequired();

            sensitive.Ignore(s => s.SensitiveData);
        });

        builder.Property(u => u.UserName)
            .HasMaxLength(UserLimits.UserNameMaxLength)
            .IsRequired();

        builder.HasIndex(u => u.UserName)
            .IsUnique();

        builder.Property(u => u.EmailHash)
            .HasMaxLength(UserLimits.EmailHashLength)
            .IsRequired();

        builder.HasIndex(u => u.EmailHash)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(UserLimits.PasswordHashLength)
            .IsRequired();

        builder.Property(u => u.IsLocked)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(UserLimits.RoleMaxLength)
            .IsRequired();

        builder.HasIndex(u => u.Role);
    }
}
