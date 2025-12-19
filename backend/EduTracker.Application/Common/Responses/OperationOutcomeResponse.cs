using EduTracker.Application.Models;

namespace EduTracker.Application.Common.Responses;

internal record OperationOutcomeResponse(
	string Id,
	string Title,
	ResponseDetail[] Details,
	object? Data = default
) : BaseOperationResponse<OperationOutcomeResponse>(Id, Title, Details)
{
	public OperationOutcomeResponse<T> WithData<T>(T data) => new(Id, Title, Details, data);
	public OperationOutcomeResponse<T> As<T>() => new(Id, Title, Details, default);
}

internal record OperationOutcomeResponse<TData>(
	string Id,
	string Title,
	ResponseDetail[] Details,
	TData? Data
) : BaseOperationResponse<OperationOutcomeResponse<TData>>(Id, Title, Details)
{
	public OperationOutcomeResponse<TData> WithData(TData data) => this with { Data = data };
}
