using EduTracker.Common.Entities;
using EduTracker.Extensions;
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
        UserName = userName.ValidateAndTrim();
        EmailHash = emailHash.ValidateAndTrim();
        PasswordHash = passwordHash.ValidateAndTrim();
    }

    public Guid Id { get; private set; } = Guid.NewGuid();

    public string UserName { get; private set; } = null!;
    public string EmailHash { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;

    // Added properties to match existing logic
    public string Role { get; private set; } = "student";
    public string Status { get; private set; } = "pending";
    public string? AvatarUrl { get; private set; }
    public string? OrganizationId { get; private set; }

    public DateTimeOffset CreatedAt => _audit.CreatedAt;
    public DateTimeOffset UpdatedAt => _audit.UpdatedAt;

    public byte[] EncryptedData => _sensitive.EncryptedData;
    public UserSensitive? SensitiveData => _sensitive.SensitiveData;

    public void SetRole(string role) => Role = role;
    public void SetStatus(string status) => Status = status;
    public void SetAvatarUrl(string? url) => AvatarUrl = url;
    public void SetOrganizationId(string? orgId) => OrganizationId = orgId;


    public void UpdateUserName(string newUserName)
    {
        UserName = newUserName.ValidateAndTrim();
        _audit.UpdateAudit();
    }

    public void UpdateEmailHash(string newEmailHash)
    {
        EmailHash = newEmailHash.ValidateAndTrim();
        _audit.UpdateAudit();
    }

    public void UpdatePasswordHash(string newPasswordHash)
    {
        PasswordHash = newPasswordHash.ValidateAndTrim();
        _audit.UpdateAudit();
    }

    public void SetSensitiveData(UserSensitive data) => _sensitive.SetSensitiveData(data);
    public void SetEncryptedData(byte[] data) => _sensitive.SetEncryptedData(data);
    public void ClearDecryptedData() => _sensitive.ClearDecryptedData();
    public void ClearEncryptedData() => _sensitive.ClearEncryptedData();

    public void UpdateAudit() => _audit.UpdateAudit();
}
