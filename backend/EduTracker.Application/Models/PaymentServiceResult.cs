namespace EduTracker.Application.Models;

public sealed record PaymentServiceResult(
    bool Succeeded,
    string? ProviderSubscriptionId,
    string? Error
);
