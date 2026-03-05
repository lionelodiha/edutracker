using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Users;

public sealed class User : IEntity, IAuditable, IHasSensitiveData<UserSensitive>
{
    public AuditState AuditState { get; private set; } = new();
    public SensitiveDataState<UserSensitive> SensitiveDataState { get; private set; } = new();

    private User() { }

    public User(string userName, string emailHash, string passwordHash)
    {
        UserName = ValidateUserName(userName);
        EmailHash = ValidateEmailHash(emailHash);
        PasswordHash = ValidatePasswordHash(passwordHash);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public byte[] EncryptedData => SensitiveDataState.EncryptedData;
    public UserSensitive? SensitiveData => SensitiveDataState.SensitiveData;

    public string UserName { get; private set; } = string.Empty;
    public string EmailHash { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;

    public bool IsLocked { get; private set; } = false;
    public UserRole Role { get; private set; } = UserRole.User;

    public void SetEncryptedData(byte[] newData)
    {
        ArgumentNullException.ThrowIfNull(newData);

        if (newData.Length is 0)
            throw new ArgumentException("Data cannot be empty.", nameof(newData));

        SensitiveDataState.SetEncryptedData(newData);
        AuditState.UpdateAudit();
    }

    public void SetSensitiveData(UserSensitive data) => SensitiveDataState.SetSensitiveData(data);
    public void ClearSensitiveData() => SensitiveDataState.ClearSensitiveData();

    public void SetUserName(string newUserName)
    {
        string validatedUserName = ValidateUserName(newUserName);

        if (UserName == validatedUserName) return;

        UserName = validatedUserName;
        AuditState.UpdateAudit();
    }

    public void SetEmailHash(string newEmailHash)
    {
        string validatedEmailHash = ValidateEmailHash(newEmailHash);

        if (EmailHash == validatedEmailHash) return;

        EmailHash = validatedEmailHash;
        AuditState.UpdateAudit();
    }

    public void SetPasswordHash(string newPasswordHash)
    {
        string validatedPasswordHash = ValidatePasswordHash(newPasswordHash);

        if (PasswordHash == validatedPasswordHash) return;

        PasswordHash = validatedPasswordHash;
        AuditState.UpdateAudit();
    }

    public void UpdateRole(UserRole newRole)
    {
        UserRole validatedRole = ValidateRole(newRole);

        if (Role == validatedRole) return;

        Role = validatedRole;
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

    private static string ValidateUserName(string userName)
    {
        if (string.IsNullOrWhiteSpace(userName))
            throw new ArgumentException("UserName cannot be null or empty.", nameof(userName));

        if (userName.Length < UserLimits.UserNameMinLength || userName.Length > UserLimits.UserNameMaxLength)
            throw new ArgumentException(
                $"UserName must be between {UserLimits.UserNameMinLength} and {UserLimits.UserNameMaxLength} characters.",
                nameof(userName)
            );

        if (!UserLimits.UserNameRegex().IsMatch(userName))
            throw new ArgumentException("UserName contains invalid characters.", nameof(userName));

        return userName;
    }

    private static string ValidateEmailHash(string emailHash)
    {
        if (string.IsNullOrWhiteSpace(emailHash))
            throw new ArgumentException("EmailHash cannot be null or empty.", nameof(emailHash));

        if (emailHash.Length is not UserLimits.EmailHashLength)
            throw new ArgumentException(
                $"EmailHash must be exactly {UserLimits.EmailHashLength} characters.",
                nameof(emailHash)
            );

        return emailHash;
    }

    private static string ValidatePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("PasswordHash cannot be null or empty.", nameof(passwordHash));

        if (passwordHash.Length is not UserLimits.PasswordHashLength)
            throw new ArgumentException(
                $"PasswordHash must be exactly {UserLimits.PasswordHashLength} characters.",
                nameof(passwordHash)
            );

        return passwordHash;
    }

    private static UserRole ValidateRole(UserRole role)
    {
        if (!Enum.IsDefined(role))
            throw new ArgumentException("Invalid role can't be used to update the user role.", nameof(role));

        return role;
    }
}
