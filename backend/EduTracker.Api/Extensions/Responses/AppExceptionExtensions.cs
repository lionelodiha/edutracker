using EduTracker.Api.Models;
using EduTracker.Application.Exceptions;

namespace EduTracker.Api.Extensions.Responses;

internal static class AppExceptionExtensions
{
    extension(AppException exception)
    {
        public ApiResponse<T> ToApiResponse<T>() => new(
            Success: false,
            MessageId: exception.Id,
            Message: exception.Message,
            Details: exception.Details,
            Data: default
        );
    }
}
