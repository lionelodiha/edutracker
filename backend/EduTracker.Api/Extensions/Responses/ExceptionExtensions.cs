using EduTracker.Api.Models;
using EduTracker.Application.Enums;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Models;

namespace EduTracker.Api.Extensions.Responses;

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
        public ApiResponse<T> ToApiResponse<T>()
        {
            return new ApiResponse<T>(
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
        public ApiResponse<T> ToApiResponse<T>()
        {
            return new ApiResponse<T>(
                Success: false,
                MessageId: "UNEXPECTED_ERROR",
                Message: "Something went wrong on our side. Please try again later.",
                Details: _contactDetail,
                Data: default
            );
        }
    }
}
