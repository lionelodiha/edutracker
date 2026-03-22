using FluentValidation;

namespace EduTracker.Application.Features.Academics.CourseOfferings.GetCourseOfferingsBySemester;

internal sealed class GetCourseOfferingsBySemesterQueryValidator : AbstractValidator<GetCourseOfferingsBySemesterQuery>
{
    public GetCourseOfferingsBySemesterQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.SemesterId)
            .NotEmpty()
            .WithMessage("SemesterId is required.");
    }
}
