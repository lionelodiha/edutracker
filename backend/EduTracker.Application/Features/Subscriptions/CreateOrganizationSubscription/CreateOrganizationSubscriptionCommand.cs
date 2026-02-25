using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Subscriptions.CreateOrganizationSubscription;

public sealed record CreateOrganizationSubscriptionCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid PlanId,
    DateTime StartsAt,
    DateTime? EndsAt,
    bool AutoRenew
) : IMessage<OperationResult<Guid>>;
