using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class PaymentTransaction : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }

    public string Reference { get; private set; } = null!;
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "USD";
    public string Status { get; private set; } = "pending"; // pending, success, failed
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public School School { get; private set; } = null!;

    private PaymentTransaction() { }
    public PaymentTransaction(Guid schoolId, string reference, decimal amount, string currency)
    {
        SchoolId = schoolId;
        Reference = reference;
        Amount = amount;
        Currency = currency;
    }

    public void MarkSuccess() => Status = "success";
    public void MarkFailed() => Status = "failed";
}
