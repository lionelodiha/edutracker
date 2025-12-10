using EduTracker.Exceptions;
using EduTracker.Models;
using EduTracker.Enums;

namespace EduTracker.Extensions.Responses;

public static class ExceptionExtensions
{
    private static readonly List<ResponseDetail> _contactDetail = [
        new ResponseDetail(
            Message: $"We encountered an unexpected error. If the issue persists, contact support with trace id.",
            Severity: ResponseSeverity.Error
        )
    ];

    extension(AppException exception)
    {
        public ApiResponse<T> ToApiResponse<T>(HttpContext? httpContext = null)
        {
            return new ApiResponse<T>(
                TraceId: GetTraceId(httpContext),
                Success: false,
                MessageId: exception.Id,
                Message: exception.Message,
                Details: exception.Details,
                Data: default
            );
        }
    }

    extension(Exception exception)
    {
        public ApiResponse<T> ToApiResponse<T>(HttpContext? httpContext = null)
        {
            string traceId = GetTraceId(httpContext);

            return new ApiResponse<T>(
                TraceId: traceId,
                Success: false,
                MessageId: "UNEXPECTED_ERROR",
                Message: "Something went wrong on our side. Please try again later.",
                Details: _contactDetail,
                Data: default
            );
        }
    }

    private static string GetTraceId(HttpContext? context)
    {
        if (!string.IsNullOrWhiteSpace(context?.TraceIdentifier))
            return context.TraceIdentifier;

        string rawId = Guid.NewGuid().ToString("N");
        return $"GEN-{rawId[..8]}";
    }
}