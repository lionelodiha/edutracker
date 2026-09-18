using EduTracker.Domain.Entities.Academics;
using FluentValidation;

namespace EduTracker.Application.Features.Departments.CreateDepartment;

internal sealed class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization id is required.");

        RuleFor(x => x.Name)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Department name is required.")
            .MinimumLength(AcademicLimits.DepartmentNameMinLength)
                .WithMessage($"Department name must be at least {AcademicLimits.DepartmentNameMinLength} characters long.")
            .MaximumLength(AcademicLimits.DepartmentNameMaxLength)
                .WithMessage($"Department name must not exceed {AcademicLimits.DepartmentNameMaxLength} characters.")
            .Matches(AcademicLimits.DepartmentNameRegex())
                .WithMessage("Department name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses.");

        RuleFor(x => x.Description)
            .MaximumLength(AcademicLimits.DepartmentDescriptionMaxLength)
                .WithMessage($"Department description must not exceed {AcademicLimits.DepartmentDescriptionMaxLength} characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
