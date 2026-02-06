using EduTracker.Application.Common.Responses;

namespace EduTracker.Application.Constants.Responses;

internal static partial class ResponseCatalog
{
    public static class Session
    {
        public static readonly OperationOutcomeResponse Retrieved = new(
            Id: "SESSION_RETRIEVED",
            Title: "Sessions retrieved successfully.",
            Details: []
        );
    }
}
