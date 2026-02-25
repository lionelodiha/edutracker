using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Subscriptions.CreateOrganizationSubscription;

public sealed record CreateOrganizationSubscriptionCommand(
    Guid? ActorId,
    Guid OrganizationId,
    SubscriptionPlan Plan,
    DateTime? TrialEndsAt,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd
) : IMessage<OperationResult<Guid>>;
