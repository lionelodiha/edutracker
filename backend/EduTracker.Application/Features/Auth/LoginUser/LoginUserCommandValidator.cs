using FluentValidation;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Features.Auth.LoginUser;

public sealed class LoginUserCommandValidator : AbstractValidator<LoginUserCommand>
{
    public LoginUserCommandValidator()
    {
        RuleFor(x => x.Identifier)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Username or email is required.")
            .MaximumLength(UserLimits.IdentifierMaxLength)
                .WithMessage($"Identifier must not exceed {UserLimits.IdentifierMaxLength} characters.");

        RuleFor(x => x.Password)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Password is required.");
    }
}
