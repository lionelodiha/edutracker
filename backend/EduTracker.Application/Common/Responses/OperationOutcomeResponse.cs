using EduTracker.Application.Models;

namespace EduTracker.Application.Common.Responses;

internal sealed record OperationOutcomeResponse(
    string Id,
    string Title,
    ResponseDetail[] Details
) : BaseOperationResponse<OperationOutcomeResponse>(Id, Title, Details)
{
    public OperationOutcomeResponse<T> As<T>() => new(Id, Title, Details);
}

internal sealed record OperationOutcomeResponse<TData>(
    string Id,
    string Title,
    ResponseDetail[] Details,
    TData? Data = default
) : BaseOperationResponse<OperationOutcomeResponse<TData>>(Id, Title, Details)
{
    public OperationOutcomeResponse<TData> WithData(TData data) => this with { Data = data };
}
