using FluentValidation;

namespace EduTracker.Application.Features.Subscriptions.UpdateOrganizationSubscription;

internal sealed class UpdateOrganizationSubscriptionCommandValidator : AbstractValidator<UpdateOrganizationSubscriptionCommand>
{
    public UpdateOrganizationSubscriptionCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization id is required.");

        RuleFor(x => x)
            .Must(x => x.PlanId.HasValue || x.StartsAt.HasValue || x.EndsAt.HasValue || x.AutoRenew.HasValue)
            .WithMessage("At least one subscription field must be provided.");

        RuleFor(x => x)
            .Must(x => !x.EndsAt.HasValue || !x.StartsAt.HasValue || x.EndsAt.Value > x.StartsAt.Value)
            .WithMessage("End date must be greater than start date.");
    }
}
