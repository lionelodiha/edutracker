using EduTracker.Api.Models;
using EduTracker.Application.Enums;
using EduTracker.Application.Models;

namespace EduTracker.Api.Extensions.Responses;

internal static class ExceptionExtensions
{
    private static readonly List<ResponseDetail> ContactDetail =
    [
        new ResponseDetail(
            Message: "We encountered an unexpected error. If the issue persists, contact support with trace id.",
            Severity: ResponseSeverity.Error
        )
    ];

    extension(Exception exception)
    {
        public ApiResponse<T> ToApiResponse<T>() => new(
            Success: false,
            MessageId: "COMMON_UNKNOWN_ERROR",
            Message: "An unexpected error occurred. Please try again later.",
            Details: ContactDetail,
            Data: default
        );
    }
}
