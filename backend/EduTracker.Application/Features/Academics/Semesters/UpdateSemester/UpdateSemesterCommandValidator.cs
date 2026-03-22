using FluentValidation;

namespace EduTracker.Application.Features.Academics.Semesters.UpdateSemester;

internal sealed class UpdateSemesterCommandValidator : AbstractValidator<UpdateSemesterCommand>
{
    public UpdateSemesterCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.SemesterId)
            .NotEmpty()
            .WithMessage("SemesterId is required.");

        RuleFor(x => x.Session)
            .NotEmpty()
            .MaximumLength(9);
    }
}
