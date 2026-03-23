using FluentValidation;

namespace EduTracker.Application.Features.Academics.Terms.GetTermsBySemester;

internal sealed class GetTermsBySemesterQueryValidator : AbstractValidator<GetTermsBySemesterQuery>
{
    public GetTermsBySemesterQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.SemesterId)
            .NotEmpty()
            .WithMessage("SemesterId is required.");
    }
}
