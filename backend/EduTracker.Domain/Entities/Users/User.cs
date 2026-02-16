using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Users;

public sealed class User : IEntity, IAuditable, IHasSensitiveData<UserSensitive>
{
    public readonly AuditState AuditState = new();
    public readonly SensitiveDataState<UserSensitive> SensitiveDataState = new();

    private User() { }

    public User(string userName, string emailHash, string passwordHash)
    {
        SetUserName(userName);
        SetEmailHash(emailHash);
        SetPasswordHash(passwordHash);
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public byte[] EncryptedData => SensitiveDataState.EncryptedData;
    public UserSensitive? SensitiveData => SensitiveDataState.SensitiveData;

    public string UserName { get; private set; } = string.Empty;
    public string EmailHash { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;

    public bool IsLocked { get; private set; }
    public UserRole Role { get; private set; } = UserRole.User;

    public ICollection<UserSession> Sessions { get; private set; } = [];

    public void SetEncryptedData(byte[] data)
    {
        ArgumentNullException.ThrowIfNull(data);

        if (data.Length is 0)
            throw new ArgumentException("Data cannot be empty.", nameof(data));

        SensitiveDataState.SetEncryptedData(data);
        AuditState.UpdateAudit();
    }

    public void SetSensitiveData(UserSensitive data) => SensitiveDataState.SetSensitiveData(data);
    public void ClearSensitiveData() => SensitiveDataState.ClearSensitiveData();

    public void SetUserName(string newUserName)
    {
        if (string.IsNullOrWhiteSpace(newUserName))
            throw new ArgumentException("UserName cannot be null or empty.", nameof(newUserName));

        if (newUserName.Length < UserLimits.UserNameMinLength || newUserName.Length > UserLimits.UserNameMaxLength)
            throw new ArgumentException(
                $"UserName must be between {UserLimits.UserNameMinLength} and {UserLimits.UserNameMaxLength} characters.",
                nameof(newUserName)
            );

        if (!UserLimits.UserNameRegex().IsMatch(newUserName))
            throw new ArgumentException("UserName contains invalid characters.", nameof(newUserName));

        UserName = newUserName;
        AuditState.UpdateAudit();
    }

    public void SetEmailHash(string newEmailHash)
    {
        if (string.IsNullOrWhiteSpace(newEmailHash))
            throw new ArgumentException("EmailHash cannot be null or empty.", nameof(newEmailHash));

        if (newEmailHash.Length is not UserLimits.EmailHashLength)
            throw new ArgumentException(
                $"EmailHash must be exactly {UserLimits.EmailHashLength} characters.",
                nameof(newEmailHash)
            );

        EmailHash = newEmailHash;
        AuditState.UpdateAudit();
    }

    public void SetPasswordHash(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new ArgumentException("PasswordHash cannot be null or empty.", nameof(newPasswordHash));

        if (newPasswordHash.Length is not UserLimits.PasswordHashLength)
            throw new ArgumentException(
                $"PasswordHash must be exactly {UserLimits.PasswordHashLength} characters.",
                nameof(newPasswordHash)
            );

        PasswordHash = newPasswordHash;
        AuditState.UpdateAudit();
    }

    public void UpdateRole(UserRole newRole)
    {
        if (!Enum.IsDefined(newRole))
            throw new ArgumentException("Invalid role can't be used to update the user role.", nameof(newRole));

        if (newRole == Role) return;

        Role = newRole;
        AuditState.UpdateAudit();
    }

    public void Lock()
    {
        if (IsLocked) return;

        IsLocked = true;
        AuditState.UpdateAudit();
    }

    public void Unlock()
    {
        if (!IsLocked) return;

        IsLocked = false;
        AuditState.UpdateAudit();
    }
}
