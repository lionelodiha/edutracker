using FluentValidation;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Features.Users.UpdateUser;

internal sealed class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("First name is required.")
            .MinimumLength(UserLimits.NameMinLength)
                .WithMessage($"First name must be at least {UserLimits.NameMinLength} characters long.")
            .MaximumLength(UserLimits.NameMaxLength)
                .WithMessage($"First name must not exceed {UserLimits.NameMaxLength} characters.")
            .Matches(UserLimits.NameRegex())
                .WithMessage("First name contains invalid characters.")
            .When(x => x.FirstName is not null);

        RuleFor(x => x.MiddleName)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .MinimumLength(UserLimits.NameMinLength)
                .WithMessage($"Middle name must be at least {UserLimits.NameMinLength} characters long.")
            .MaximumLength(UserLimits.NameMaxLength)
                .WithMessage($"Middle name must not exceed {UserLimits.NameMaxLength} characters.")
            .Matches(UserLimits.NameRegex())
                .WithMessage("Middle name contains invalid characters.")
            .When(x => x.MiddleName is not null);

        RuleFor(x => x.LastName)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Last name is required.")
            .MinimumLength(UserLimits.NameMinLength)
                .WithMessage($"Last name must be at least {UserLimits.NameMinLength} characters long.")
            .MaximumLength(UserLimits.NameMaxLength)
                .WithMessage($"Last name must not exceed {UserLimits.NameMaxLength} characters.")
            .Matches(UserLimits.NameRegex())
                .WithMessage("Last name contains invalid characters.")
            .When(x => x.LastName is not null);

        RuleFor(x => x.UserName)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Username is required.")
            .MinimumLength(UserLimits.UserNameMinLength)
                .WithMessage($"Username must be at least {UserLimits.UserNameMinLength} characters long.")
            .MaximumLength(UserLimits.UserNameMaxLength)
                .WithMessage($"Username must not exceed {UserLimits.UserNameMaxLength} characters.")
            .Matches(UserLimits.UserNameRegex())
                .WithMessage("Username may only contain letters, numbers, underscores, and hyphens.")
            .When(x => x.UserName is not null);
    }
}
