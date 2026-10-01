using EduTracker.Domain.Entities.Academics;
using FluentValidation;

namespace EduTracker.Application.Features.Terms.CreateTerm;

internal sealed class CreateTermCommandValidator : AbstractValidator<CreateTermCommand>
{
    public CreateTermCommandValidator()
    {
        RuleFor(x => x.Ordinal)
            .InclusiveBetween(AcademicLimits.MinTermNumber, AcademicLimits.MaxTermNumber)
            .WithMessage($"Ordinal must be between {AcademicLimits.MinTermNumber} and {AcademicLimits.MaxTermNumber}.");
    }
}
