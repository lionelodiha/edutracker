using FluentValidation;

namespace EduTracker.Application.Features.Academics.Courses.UpdateCourse;

internal sealed class UpdateCourseCommandValidator : AbstractValidator<UpdateCourseCommand>
{
    public UpdateCourseCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage("CourseId is required.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(20);
    }
}
