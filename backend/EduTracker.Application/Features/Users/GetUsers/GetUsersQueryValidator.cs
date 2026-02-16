using FluentValidation;
using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Features.Users.GetUsers;

public sealed class GetUsersQueryValidator : AbstractValidator<GetUsersQuery>
{
    private const int MaxPageSize = 100;

    public GetUsersQueryValidator()
    {
        RuleFor(x => x.Limit)
            .GreaterThan(0).WithMessage("Limit must be greater than 0.")
            .LessThanOrEqualTo(MaxPageSize)
            .WithMessage($"Limit cannot exceed {MaxPageSize}.")
            .When(x => x.Limit.HasValue);

        RuleFor(x => x.Cursor)
            .Must(guid => guid != Guid.Empty)
            .WithMessage("Cursor must be a valid GUID.")
            .When(x => x.Cursor.HasValue);

        RuleFor(x => x.UserName)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .MinimumLength(1)
                .WithMessage($"Username must be at least {1} characters long.")
            .MaximumLength(UserLimits.UserNameMaxLength)
                .WithMessage($"Username must not exceed {UserLimits.UserNameMaxLength} characters.")
            .Matches(UserLimits.UserNameRegex())
                .WithMessage("Username may only contain letters, numbers, underscores, and hyphens.");
    }
}
