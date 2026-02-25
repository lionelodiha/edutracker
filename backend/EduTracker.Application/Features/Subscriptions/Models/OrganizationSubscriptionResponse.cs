namespace EduTracker.Application.Features.Subscriptions.Models;

public sealed record OrganizationSubscriptionResponse(
    Guid Id,
    Guid OrganizationId,
    Guid PlanId,
    DateTime StartsAt,
    DateTime? EndsAt,
    bool AutoRenew,
    DateTime? CancelledAt,
    bool IsActive,
    bool IsExpired,
    bool IsCancelled
);
