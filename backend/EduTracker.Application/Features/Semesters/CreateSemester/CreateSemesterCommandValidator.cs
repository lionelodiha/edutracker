using FluentValidation;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Features.Semesters.CreateSemester;

internal sealed class CreateSemesterCommandValidator : AbstractValidator<CreateSemesterCommand>
{
    public CreateSemesterCommandValidator()
    {
        RuleFor(x => x.StartYear)
            .InclusiveBetween(
                DateTime.UtcNow.Year - AcademicLimits.MaxPastYears,
                DateTime.UtcNow.Year + AcademicLimits.MaxFutureYears
            )
            .WithMessage("StartYear must be within the allowed academic range.");
    }
}
