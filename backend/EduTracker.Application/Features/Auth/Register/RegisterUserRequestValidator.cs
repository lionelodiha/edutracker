using FluentValidation;

namespace EduTracker.Application.Features.Auth.Register;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.FirstName).Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(40);

        RuleFor(x => x.MiddleName).Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(40);

        RuleFor(x => x.LastName).Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(60);

        RuleFor(x => x.UserName).Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(30)
            .Matches("^[^@]+$")
            .WithMessage("Username cannot contain '@'.");

        RuleFor(x => x.Email).Cascade(CascadeMode.Stop)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(x => x.Password).Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MinimumLength(8);

        When(x => !string.IsNullOrEmpty(x.Password), () =>
        {
            RuleFor(x => x.Password)
                .Must(ContainUppercase).WithMessage("Password must contain at least one uppercase letter.")
                .Must(ContainLowercase).WithMessage("Password must contain at least one lowercase letter.")
                .Must(ContainDigit).WithMessage("Password must contain at least one number.")
                .Must(ContainSymbol).WithMessage("Password must contain at least one special character.");
        });
    }

    private bool ContainUppercase(string password) => password.Any(char.IsUpper);
    private bool ContainLowercase(string password) => password.Any(char.IsLower);
    private bool ContainDigit(string password) => password.Any(char.IsDigit);
    private bool ContainSymbol(string password) => password.Any(c => !char.IsLetterOrDigit(c));
}
