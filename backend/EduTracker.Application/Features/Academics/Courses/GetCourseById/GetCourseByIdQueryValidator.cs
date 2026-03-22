using FluentValidation;

namespace EduTracker.Application.Features.Academics.Courses.GetCourseById;

internal sealed class GetCourseByIdQueryValidator : AbstractValidator<GetCourseByIdQuery>
{
    public GetCourseByIdQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage("CourseId is required.");
    }
}
