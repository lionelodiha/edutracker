using FluentValidation;

namespace EduTracker.Application.Features.Subscriptions.CreateOrganizationSubscription;

internal sealed class CreateOrganizationSubscriptionCommandValidator : AbstractValidator<CreateOrganizationSubscriptionCommand>
{
    public CreateOrganizationSubscriptionCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization id is required.");

        RuleFor(x => x.PlanId)
            .NotEmpty().WithMessage("Plan id is required.");

        RuleFor(x => x)
            .Must(x => !x.EndsAt.HasValue || x.EndsAt.Value > x.StartsAt)
            .WithMessage("End date must be greater than start date.");
    }
}
