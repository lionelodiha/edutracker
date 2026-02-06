using FluentValidation;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Features.Auth.RegisterUser;

public sealed class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("First name is required.")
            .MinimumLength(UserLimits.NameMinLength)
                .WithMessage($"First name must be at least {UserLimits.NameMinLength} characters long.")
            .MaximumLength(UserLimits.NameMaxLength)
                .WithMessage($"First name must not exceed {UserLimits.NameMaxLength} characters.")
            .Matches(UserLimits.NameRegex())
                .WithMessage("First name contains invalid characters.");

        RuleFor(x => x.MiddleName)
            .Cascade(CascadeMode.Stop)
            .MinimumLength(UserLimits.NameMinLength)
                .WithMessage($"Middle name must be at least {UserLimits.NameMinLength} characters long.")
            .MaximumLength(UserLimits.NameMaxLength)
                .WithMessage($"Middle name must not exceed {UserLimits.NameMaxLength} characters.")
            .Matches(UserLimits.NameRegex())
                .WithMessage("Middle name contains invalid characters.");

        RuleFor(x => x.LastName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Last name is required.")
            .MinimumLength(UserLimits.NameMinLength)
                .WithMessage($"Last name must be at least {UserLimits.NameMinLength} characters long.")
            .MaximumLength(UserLimits.NameMaxLength)
                .WithMessage($"Last name must not exceed {UserLimits.NameMaxLength} characters.")
            .Matches(UserLimits.NameRegex())
                .WithMessage("Last name contains invalid characters.");

        RuleFor(x => x.UserName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Username is required.")
            .MinimumLength(UserLimits.UserNameMinLength)
                .WithMessage($"Username must be at least {UserLimits.UserNameMinLength} characters long.")
            .MaximumLength(UserLimits.UserNameMaxLength)
                .WithMessage($"Username must not exceed {UserLimits.UserNameMaxLength} characters.")
            .Matches(UserLimits.UserNameRegex())
                .WithMessage("Username may only contain letters, numbers, underscores, and hyphens.");

        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email address is required.")
            .MaximumLength(UserLimits.EmailMaxLength)
                .WithMessage($"Email address must not exceed {UserLimits.EmailMaxLength} characters.")
            .Matches(UserLimits.EmailRegex())
                .WithMessage("Please provide a valid email address.");

        RuleFor(x => x.Password)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(UserLimits.PasswordMinLength)
                .WithMessage($"Password must be at least {UserLimits.PasswordMinLength} characters long.")
            .Matches(UserLimits.PasswordNoSpacesRegex())
                .WithMessage("Password cannot contain spaces.");

        When(x => !string.IsNullOrEmpty(x.Password), () =>
        {
            RuleFor(x => x.Password)
                .Cascade(CascadeMode.Stop)
                .Must(ContainUppercase).WithMessage("Password must contain at least one uppercase letter.")
                .Must(ContainLowercase).WithMessage("Password must contain at least one lowercase letter.")
                .Must(ContainDigit).WithMessage("Password must contain at least one number.")
                .Must(ContainSymbol).WithMessage("Password must contain at least one special character.");
        });
    }

    private static bool ContainUppercase(string password) => password.Any(char.IsUpper);
    private static bool ContainLowercase(string password) => password.Any(char.IsLower);
    private static bool ContainDigit(string password) => password.Any(char.IsDigit);
    private static bool ContainSymbol(string password) => password.Any(c => !char.IsLetterOrDigit(c));
}
