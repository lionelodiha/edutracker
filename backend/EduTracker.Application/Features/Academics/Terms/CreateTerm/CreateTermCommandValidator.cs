using FluentValidation;

namespace EduTracker.Application.Features.Academics.Terms.CreateTerm;

internal sealed class CreateTermCommandValidator : AbstractValidator<CreateTermCommand>
{
    public CreateTermCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.SemesterId)
            .NotEmpty()
            .WithMessage("SemesterId is required.");

        RuleFor(x => x.Ordinal)
            .InclusiveBetween(1, 3)
            .WithMessage("Ordinal must be between 1 and 3.");
    }
}
