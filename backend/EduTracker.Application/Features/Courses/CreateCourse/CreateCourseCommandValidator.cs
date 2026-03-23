using FluentValidation;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Features.Courses.CreateCourse;

internal sealed class CreateCourseCommandValidator : AbstractValidator<CreateCourseCommand>
{
    public CreateCourseCommandValidator()
    {
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Course name is required.")
            .MinimumLength(AcademicLimits.CourseNameMinLength)
                .WithMessage($"Course name must be at least {AcademicLimits.CourseNameMinLength} characters long.")
            .MaximumLength(AcademicLimits.CourseNameMaxLength)
                .WithMessage($"Course name must not exceed {AcademicLimits.CourseNameMaxLength} characters.")
            .Matches(AcademicLimits.CourseNameRegex())
                .WithMessage("Course name can only contain letters, spaces, hyphens, and parentheses.");

        RuleFor(x => x.Code)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Course code is required.")
            .MinimumLength(AcademicLimits.CourseCodeMinLength)
                .WithMessage($"Course code must be at least {AcademicLimits.CourseCodeMinLength} characters long.")
            .MaximumLength(AcademicLimits.CourseCodeMaxLength)
                .WithMessage($"Course code must not exceed {AcademicLimits.CourseCodeMaxLength} characters.")
            .Matches(AcademicLimits.CourseCodeRegex())
                .WithMessage("Course code can only contain uppercase letters, numbers, hyphens, and underscores.");
    }
}
