using FluentValidation;

namespace EduTracker.Application.Features.Auth.Login;

public class LoginUserCommandValidatior : AbstractValidator<LoginUserCommand>
{
    public LoginUserCommandValidatior()
    {
        RuleFor(x => x.Identifier)
            .NotEmpty()
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}
