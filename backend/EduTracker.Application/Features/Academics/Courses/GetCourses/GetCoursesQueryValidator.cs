using FluentValidation;

namespace EduTracker.Application.Features.Academics.Courses.GetCourses;

internal sealed class GetCoursesQueryValidator : AbstractValidator<GetCoursesQuery>
{
    public GetCoursesQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");
    }
}
