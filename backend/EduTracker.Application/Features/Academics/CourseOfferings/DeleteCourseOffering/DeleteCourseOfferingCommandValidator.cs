using FluentValidation;

namespace EduTracker.Application.Features.Academics.CourseOfferings.DeleteCourseOffering;

internal sealed class DeleteCourseOfferingCommandValidator : AbstractValidator<DeleteCourseOfferingCommand>
{
    public DeleteCourseOfferingCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.CourseOfferingId)
            .NotEmpty()
            .WithMessage("CourseOfferingId is required.");
    }
}
