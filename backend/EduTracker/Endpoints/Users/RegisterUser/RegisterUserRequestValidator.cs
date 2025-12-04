using FluentValidation;

namespace EduTracker.Endpoints.Users.RegisterUser;

public class RegisterUserRequestValidator : AbstractValidator<RegisterUserRequest>
{
    public RegisterUserRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(40);

        RuleFor(x => x.MiddleName)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(40);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(60);

        RuleFor(x => x.UserName)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(30);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Must(ContainUppercase).WithMessage("Password must contain at least one uppercase letter.")
            .Must(ContainLowercase).WithMessage("Password must contain at least one lowercase letter.")
            .Must(ContainDigit).WithMessage("Password must contain at least one number.")
            .Must(ContainSymbol).WithMessage("Password must contain at least one special character.");
    }

    private bool ContainUppercase(string password) => password.Any(char.IsUpper);
    private bool ContainLowercase(string password) => password.Any(char.IsLower);
    private bool ContainDigit(string password) => password.Any(char.IsDigit);
    private bool ContainSymbol(string password) => password.Any(c => !char.IsLetterOrDigit(c));
}
