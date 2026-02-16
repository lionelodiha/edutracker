using FluentValidation;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Features.Users.UpdateUserPassword;

public sealed class UpdateUserPasswordCommandValidator : AbstractValidator<UpdateUserPasswordCommand>
{
    public UpdateUserPasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(UserLimits.PasswordMinLength)
                .WithMessage($"Password must be at least {UserLimits.PasswordMinLength} characters long.")
            .Matches(UserLimits.PasswordNoSpacesRegex())
                .WithMessage("Password cannot contain spaces.");

        When(x => !string.IsNullOrEmpty(x.NewPassword), () =>
        {
            RuleFor(x => x.NewPassword)
                .Cascade(CascadeMode.StopOnFirstFailure)
                .Must(ContainUppercase).WithMessage("Password must contain at least one uppercase letter.")
                .Must(ContainLowercase).WithMessage("Password must contain at least one lowercase letter.")
                .Must(ContainDigit).WithMessage("Password must contain at least one number.")
                .Must(ContainSymbol).WithMessage("Password must contain at least one special character.");
        });

        When(x => !string.IsNullOrEmpty(x.NewPassword) && !string.IsNullOrEmpty(x.CurrentPassword), () =>
        {
            RuleFor(x => x.NewPassword)
                .NotEqual(x => x.CurrentPassword)
                .WithMessage("New password must be different from current password.");
        });
    }

    private static bool ContainUppercase(string password) => password.Any(char.IsUpper);
    private static bool ContainLowercase(string password) => password.Any(char.IsLower);
    private static bool ContainDigit(string password) => password.Any(char.IsDigit);
    private static bool ContainSymbol(string password) => password.Any(c => !char.IsLetterOrDigit(c));
}
