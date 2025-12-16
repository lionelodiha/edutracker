using EduTracker.Application.Models;

namespace EduTracker.Application.Common.Responses;

internal record OperationFailureResponse(
	string Id,
	int StatusCode,
	string Title,
	ResponseDetail[] Details
) : BaseOperationResponse<OperationFailureResponse>(Id, Title, Details);
