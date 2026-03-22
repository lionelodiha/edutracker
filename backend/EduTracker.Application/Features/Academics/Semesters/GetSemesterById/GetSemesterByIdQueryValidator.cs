using FluentValidation;

namespace EduTracker.Application.Features.Academics.Semesters.GetSemesterById;

internal sealed class GetSemesterByIdQueryValidator : AbstractValidator<GetSemesterByIdQuery>
{
    public GetSemesterByIdQueryValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty()
            .WithMessage("OrganizationId is required.");

        RuleFor(x => x.SemesterId)
            .NotEmpty()
            .WithMessage("SemesterId is required.");
    }
}
