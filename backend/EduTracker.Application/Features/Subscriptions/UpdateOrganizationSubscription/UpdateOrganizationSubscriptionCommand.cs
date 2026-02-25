using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Subscriptions.UpdateOrganizationSubscription;

public sealed record UpdateOrganizationSubscriptionCommand(
    Guid? ActorId,
    Guid OrganizationId,
    SubscriptionPlan? Plan,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd
) : IMessage<OperationResult<object>>;
