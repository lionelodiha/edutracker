using EduTracker.Application.Common.Responses;
using EduTracker.Application.Constants.Http;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class System
    {
        public static readonly OperationFailureResponse ValidationFailed = new(
            Id: "SYSTEM_VALIDATION_FAILED",
            StatusCode: HttpStatusCodes.BadRequest,
            Title: "Validation failed.",
            Details: []
        );
    }
}
