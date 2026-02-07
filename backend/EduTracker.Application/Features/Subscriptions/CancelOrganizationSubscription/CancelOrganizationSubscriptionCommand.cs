using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Subscriptions.CancelOrganizationSubscription;

public sealed record CancelOrganizationSubscriptionCommand(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<object>>;
