using EduTracker.Domain.Enums;

namespace EduTracker.Application.Features.Subscriptions.Models;

public sealed record OrganizationSubscriptionResponse(
    Guid Id,
    Guid OrganizationId,
    Guid OwnerUserId,
    SubscriptionPlan Plan,
    SubscriptionStatus Status,
    DateTime? TrialEndsAt,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd
);
