using FluentValidation;

namespace EduTracker.Application.Features.Academics.Semesters.CreateSemester;

internal sealed class CreateSemesterCommandValidator : AbstractValidator<CreateSemesterCommand>
{
    public CreateSemesterCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.StartYear)
            .InclusiveBetween(DateTime.UtcNow.Year - 20, DateTime.UtcNow.Year + 20)
            .WithMessage("StartYear must be within the allowed academic range.");
    }
}
