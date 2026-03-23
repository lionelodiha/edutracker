using FluentValidation;

namespace EduTracker.Application.Features.Academics.Terms.GetTermById;

internal sealed class GetTermByIdQueryValidator : AbstractValidator<GetTermByIdQuery>
{
    public GetTermByIdQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.TermId)
            .NotEmpty()
            .WithMessage("TermId is required.");
    }
}
