namespace EduTracker.Application.Models;

public sealed record OperationResult<T>(
    string MessageId,
    string Message,
    List<ResponseDetail>? Details,
    T? Data
);
