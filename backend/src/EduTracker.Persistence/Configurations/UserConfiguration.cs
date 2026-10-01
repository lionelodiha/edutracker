using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;
using EduTracker.Domain.Entities.Users;
using EduTracker.Persistence.Extensions;
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
                .HasColumnName(nameof(AuditState.CreatedAt).ToSnakeCase())
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName(nameof(AuditState.UpdatedAt).ToSnakeCase())
                .IsRequired();
        });

        builder.OwnsOne(u => u.SensitiveDataState, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName(nameof(SensitiveDataState<>.EncryptedData).ToSnakeCase())
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
