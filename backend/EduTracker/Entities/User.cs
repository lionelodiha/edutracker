using EduTracker.Common.Entities;
using EduTracker.Enums;
using EduTracker.Extensions.Validations;
using EduTracker.Models;

namespace EduTracker.Entities;

public class User : IEntity, IAuditableEntity, ISensitiveEntity<UserSensitive>
{
    private readonly AuditableDataHandler _audit = new();
    private readonly SensitiveDataHandler<UserSensitive> _sensitive = new();

    public static string Audit => nameof(_audit);
    public static string Sensitive => nameof(_sensitive);

    private User() { }

    public User(string userName, string emailHash, string passwordHash)
    {
        UserName = userName.EnsureNotEmptyAndTrim();
        EmailHash = emailHash.EnsureNotEmptyAndTrim();
        PasswordHash = passwordHash.EnsureNotEmptyAndTrim();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public string UserName { get; private set; } = null!;
    public string EmailHash { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public SystemRole Role { get; private set; } = SystemRole.User;

    public DateTimeOffset CreatedAt => _audit.CreatedAt;
    public DateTimeOffset UpdatedAt => _audit.UpdatedAt;

    public byte[] EncryptedData => _sensitive.EncryptedData;
    public UserSensitive? SensitiveData => _sensitive.SensitiveData;

    public void SetRole(SystemRole role)
    {
        Role = role;
        _audit.UpdateAudit();
    }

    public void UpdateUserName(string newUserName)
    {
        UserName = newUserName.EnsureNotEmptyAndTrim();
        _audit.UpdateAudit();
    }

    public void UpdateEmailHash(string newEmailHash)
    {
        EmailHash = newEmailHash.EnsureNotEmptyAndTrim();
        _audit.UpdateAudit();
    }

    public void UpdatePasswordHash(string newPasswordHash)
    {
        PasswordHash = newPasswordHash.EnsureNotEmptyAndTrim();
        _audit.UpdateAudit();
    }

    public void SetSensitiveData(UserSensitive data) => _sensitive.SetSensitiveData(data);
    public void SetEncryptedData(byte[] data) => _sensitive.SetEncryptedData(data, _audit);
    public void ClearDecryptedData() => _sensitive.ClearDecryptedData();
    public void ClearEncryptedData() => _sensitive.ClearEncryptedData();

    public void UpdateAudit() => _audit.UpdateAudit();
}
