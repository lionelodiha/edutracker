namespace EduTracker.Models;

public record ApiResponse<T>(
    string? TraceId,
    bool Success,
    string MessageId,
    string Message,
    List<ResponseDetail>? Details,
    T? Data
)
{
    public DateTime Timestamp { get; private init; } = DateTime.UtcNow;
}
