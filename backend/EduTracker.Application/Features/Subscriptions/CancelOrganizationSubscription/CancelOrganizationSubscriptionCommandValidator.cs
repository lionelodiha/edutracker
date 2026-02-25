using FluentValidation;

namespace EduTracker.Application.Features.Subscriptions.CancelOrganizationSubscription;

internal sealed class CancelOrganizationSubscriptionCommandValidator : AbstractValidator<CancelOrganizationSubscriptionCommand>
{
    public CancelOrganizationSubscriptionCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Organization id is required.");
    }
}
