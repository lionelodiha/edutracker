using FluentValidation;

namespace EduTracker.Application.Features.Academics.Semesters.GetSemesters;

internal sealed class GetSemestersQueryValidator : AbstractValidator<GetSemestersQuery>
{
    public GetSemestersQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");
    }
}
