using EduTracker.Application.Models;

namespace EduTracker.Api.Models;

internal sealed record ApiResponse<T>(
    bool Success,
    string MessageId,
    string Message,
    List<ResponseDetail>? Details,
    T? Data
);
