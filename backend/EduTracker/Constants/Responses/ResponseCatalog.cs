using EduTracker.Common.Responses;

namespace EduTracker.Constants.Responses;

public static partial class ResponseCatalog
{
    public static class System
    {
        public static readonly OperationFailureResponse ValidationFailed = new(
            Id: "SYSTEM_VALIDATION_FAILED",
            StatusCode: 400,
            Title: "Validation failed.",
            Details: []
        );
    }
}
