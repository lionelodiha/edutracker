using FluentValidation;

namespace EduTracker.Application.Features.Academics.CourseOfferings.CreateCourseOffering;

internal sealed class CreateCourseOfferingCommandValidator : AbstractValidator<CreateCourseOfferingCommand>
{
    public CreateCourseOfferingCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage("CourseId is required.");

        RuleFor(x => x.TermId)
            .NotEmpty()
            .WithMessage("TermId is required.");
    }
}
