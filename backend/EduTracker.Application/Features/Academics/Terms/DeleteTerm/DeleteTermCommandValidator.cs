using FluentValidation;

namespace EduTracker.Application.Features.Academics.Terms.DeleteTerm;

internal sealed class DeleteTermCommandValidator : AbstractValidator<DeleteTermCommand>
{
    public DeleteTermCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.TermId)
            .NotEmpty()
            .WithMessage("TermId is required.");
    }
}
