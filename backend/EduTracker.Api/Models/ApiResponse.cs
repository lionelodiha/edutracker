using EduTracker.Application.Models;

namespace EduTracker.Api.Models;

public record ApiResponse<T>(
    bool Success,
    string MessageId,
    string Message,
    List<ResponseDetail>? Details,
    T? Data
)
{
    public DateTimeOffset Timestamp { get; private init; } = DateTimeOffset.UtcNow;
}
