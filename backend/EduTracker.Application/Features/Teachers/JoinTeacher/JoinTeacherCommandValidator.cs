using EduTracker.Domain.Entities.Academics;
using FluentValidation;

namespace EduTracker.Application.Features.Teachers.JoinTeacher;

internal sealed class JoinTeacherCommandValidator : AbstractValidator<JoinTeacherCommand>
{
    public JoinTeacherCommandValidator()
    {
        RuleFor(x => x.StaffId)
            .Cascade(CascadeMode.StopOnFirstFailure)
            .NotEmpty().WithMessage("Staff ID is required.")
            .MinimumLength(AcademicLimits.TeacherStaffIdMinLength)
                .WithMessage($"Staff ID must be at least {AcademicLimits.TeacherStaffIdMinLength} characters long.")
            .MaximumLength(AcademicLimits.TeacherStaffIdMaxLength)
                .WithMessage($"Staff ID must not exceed {AcademicLimits.TeacherStaffIdMaxLength} characters.")
            .Matches(AcademicLimits.TeacherStaffIdRegex())
                .WithMessage("Staff ID can only contain uppercase letters, numbers, hyphens, and underscores.");
    }
}
