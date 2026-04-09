using EduTracker.Domain.Entities.Academics;
using FluentValidation;

namespace EduTracker.Application.Features.Students.CreateStudent;

internal sealed class CreateStudentCommandValidator : AbstractValidator<CreateStudentCommand>
{
    public CreateStudentCommandValidator()
    {
        RuleFor(x => x.StudentNumber)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Student number is required.")
            .MinimumLength(AcademicLimits.StudentNumberMinLength)
                .WithMessage($"Student number must be at least {AcademicLimits.StudentNumberMinLength} characters long.")
            .MaximumLength(AcademicLimits.StudentNumberMaxLength)
                .WithMessage($"Student number must not exceed {AcademicLimits.StudentNumberMaxLength} characters.")
            .Matches(AcademicLimits.StudentNumberRegex())
                .WithMessage("Student number can only contain uppercase letters, numbers, hyphens, and underscores.");
    }
}
