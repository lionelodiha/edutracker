using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Subscriptions.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Subscriptions.GetOrganizationSubscription;

public sealed record GetOrganizationSubscriptionQuery(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<OrganizationSubscriptionResponse>>;
