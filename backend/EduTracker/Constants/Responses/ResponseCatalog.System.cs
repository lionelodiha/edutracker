using EduTracker.Common.Responses;

namespace EduTracker.Constants.Responses;

public static partial class ResponseCatalog
{
    public static class System
    {
        public static readonly OperationFailureResponse ValidationFailed = new(
            Id: "SYSTEM_VALIDATION_FAILED",
            StatusCode: StatusCodes.Status400BadRequest,
            Title: "Validation failed.",
            Details: []
        );
    }
}
