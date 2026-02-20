using System.Net.Mail;
using System.Text.Json.Serialization;
using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Entities.Users;

public sealed class UserSensitive : ISensitiveData
{
    [JsonConstructor]
    private UserSensitive(string firstName, string? middleName, string lastName, string email)
    {
        FirstName = firstName;
        MiddleName = middleName;
        LastName = lastName;
        Email = email;
    }

    public string FirstName { get; private set; } = string.Empty;
    public string? MiddleName { get; private set; }
    public string LastName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;

    public static UserSensitive Create(string firstName, string? middleName, string lastName, string email)
    {
        ValidateName(firstName, nameof(firstName), isRequired: true);
        ValidateName(middleName, nameof(middleName), isRequired: false);
        ValidateName(lastName, nameof(lastName), isRequired: true);

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required", nameof(email));

        if (email.Length > UserLimits.EmailMaxLength)
            throw new ArgumentException($"Email cannot exceed {UserLimits.EmailMaxLength} characters", nameof(email));

        if (!IsValidEmail(email))
            throw new ArgumentException("Email format is invalid", nameof(email));

        return new UserSensitive(
            firstName.Trim(),
            middleName?.Trim(),
            lastName.Trim(),
            email.Trim().ToLowerInvariant()
        );
    }

    public void UpdateName(string firstName, string? middleName, string lastName)
    {
        ValidateName(firstName, nameof(firstName), isRequired: true);
        ValidateName(middleName, nameof(middleName), isRequired: false);
        ValidateName(lastName, nameof(lastName), isRequired: true);

        FirstName = firstName.Trim();
        MiddleName = middleName?.Trim();
        LastName = lastName.Trim();
    }

    private static void ValidateName(string? name, string paramName, bool isRequired)
    {
        if (isRequired && string.IsNullOrWhiteSpace(name))
            throw new ArgumentException($"{paramName} is required", paramName);

        if (name is null) return;

        if (name.Length < UserLimits.NameMinLength || name.Length > UserLimits.NameMaxLength)
            throw new ArgumentException(
                $"{paramName} must be between {UserLimits.NameMinLength} and {UserLimits.NameMaxLength} characters",
                paramName
            );

        if (!UserLimits.NameRegex().IsMatch(name))
            throw new ArgumentException($"{paramName} contains invalid characters", paramName);
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            MailAddress emailAddress = new(email);
            return emailAddress.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
