using EduTracker.Models;

namespace EduTracker.Common.Responses;

public record OperationOutcomeResponse(
	string Id,
	string Title,
	ResponseDetail[] Details,
	object? Data = null
) : BaseOperationResponse<OperationOutcomeResponse>(Id, Title, Details)
{
	public OperationOutcomeResponse WithData(object data) => this with { Data = data };
	public OperationOutcomeResponse<T> As<T>() => new(Id, Title, Details, (T?)Data);
}

public record OperationOutcomeResponse<TData>(
	string Id,
	string Title,
	ResponseDetail[] Details,
	TData? Data
) : BaseOperationResponse<OperationOutcomeResponse<TData>>(Id, Title, Details)
{
	public OperationOutcomeResponse<TData> WithData(TData data) => this with { Data = data };
}
