using FluentValidation;

namespace EduTracker.Application.Features.Academics.Courses.DeleteCourse;

internal sealed class DeleteCourseCommandValidator : AbstractValidator<DeleteCourseCommand>
{
    public DeleteCourseCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage("CourseId is required.");
    }
}
