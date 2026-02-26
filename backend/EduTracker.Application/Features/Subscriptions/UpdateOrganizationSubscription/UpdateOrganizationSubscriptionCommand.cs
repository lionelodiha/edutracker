using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Subscriptions.UpdateOrganizationSubscription;

public sealed record UpdateOrganizationSubscriptionCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid? PlanId,
    DateTime? StartsAt,
    DateTime? EndsAt,
    bool? AutoRenew
) : IMessage<OperationResult<object>>;
