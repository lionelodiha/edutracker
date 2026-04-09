using EduTracker.Domain.Entities.Academics;
using FluentValidation;

namespace EduTracker.Application.Features.Classes.UpdateClass;

internal sealed class UpdateClassCommandValidator : AbstractValidator<UpdateClassCommand>
{
    public UpdateClassCommandValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Class name is required.")
            .MinimumLength(AcademicLimits.ClassNameMinLength)
                .WithMessage($"Class name must be at least {AcademicLimits.ClassNameMinLength} characters long.")
            .MaximumLength(AcademicLimits.ClassNameMaxLength)
                .WithMessage($"Class name must not exceed {AcademicLimits.ClassNameMaxLength} characters.")
            .Matches(AcademicLimits.ClassNameRegex())
                .WithMessage("Class name can only contain letters, numbers, spaces, hyphens, and parentheses.");

        RuleFor(x => x.Code)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Class code is required.")
            .MinimumLength(AcademicLimits.ClassCodeMinLength)
                .WithMessage($"Class code must be at least {AcademicLimits.ClassCodeMinLength} characters long.")
            .MaximumLength(AcademicLimits.ClassCodeMaxLength)
                .WithMessage($"Class code must not exceed {AcademicLimits.ClassCodeMaxLength} characters.")
            .Matches(AcademicLimits.ClassCodeRegex())
                .WithMessage("Class code can only contain uppercase letters, numbers, hyphens, and underscores.");
    }
}
