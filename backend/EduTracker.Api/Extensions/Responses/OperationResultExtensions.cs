using EduTracker.Api.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Extensions.Responses;

internal static class OperationResultExtensions
{
    extension<T>(OperationResult<T> result)
    {
        public OperationResult<object> WithoutData() => new(
            MessageId: result.MessageId,
            Message: result.Message,
            Details: result.Details,
            Data: null
        );

        public ApiResponse<T> ToApiResponse() => new(
            Success: true,
            MessageId: result.MessageId,
            Message: result.Message,
            Details: result.Details,
            Data: result.Data
        );
    }
}
