using EduTracker.Models;

namespace EduTracker.Common.Responses;

public record OperationFailureResponse(
	string Id,
	int StatusCode,
	string Title,
	ResponseDetail[] Details
) : BaseOperationResponse<OperationFailureResponse>(Id, Title, Details);
