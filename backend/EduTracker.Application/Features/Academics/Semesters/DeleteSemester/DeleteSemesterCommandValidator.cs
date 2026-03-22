using FluentValidation;

namespace EduTracker.Application.Features.Academics.Semesters.DeleteSemester;

internal sealed class DeleteSemesterCommandValidator : AbstractValidator<DeleteSemesterCommand>
{
    public DeleteSemesterCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.SemesterId)
            .NotEmpty()
            .WithMessage("SemesterId is required.");
    }
}
