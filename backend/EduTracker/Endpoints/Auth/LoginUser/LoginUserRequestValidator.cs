namespace EduTracker.Endpoints.Auth.LoginUser;

public class LoginUserRequestValidator : AbstractValidator<LoginUserRequest>
{
    public LoginUserRequestValidator()
    {
        RuleFor(x => x.Identifier)
            .NotEmpty()
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}
