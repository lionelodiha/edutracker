using FluentValidation;

namespace EduTracker.Application.Features.Academics.Semesters.CreateSemester;

internal sealed class CreateSemesterCommandValidator : AbstractValidator<CreateSemesterCommand>
{
    public CreateSemesterCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.Session)
            .NotEmpty()
            .MaximumLength(9);
    }
}
