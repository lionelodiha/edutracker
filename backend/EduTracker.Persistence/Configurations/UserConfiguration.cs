using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;
using EduTracker.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduTracker.Persistence.Configurations;

internal class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.HasIndex(u => u.UserName)
            .IsUnique();

        builder.Property(u => u.UserName)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(u => u.EmailHash)
            .IsUnique();

        builder.Property(u => u.EmailHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .IsRequired();

        builder.OwnsOne<AuditState>(User.Audit, audit =>
        {
            audit.Property(a => a.CreatedAt)
                .HasColumnName("CreatedAt")
                .IsRequired();

            audit.Property(a => a.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .IsRequired();
        });

        builder.OwnsOne<SensitiveDataState<UserSensitive>>(User.Sensitive, sensitive =>
        {
            sensitive.Property(s => s.EncryptedData)
                .HasColumnName("Data")
                .IsRequired();

            sensitive.Ignore(s => s.SensitiveData);
        });

        builder.HasMany(u => u.Sessions)
            .WithOne(us => us.User)
            .HasForeignKey(us => us.UserId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
    }
}
