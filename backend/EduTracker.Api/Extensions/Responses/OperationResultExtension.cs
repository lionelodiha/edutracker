using EduTracker.Api.Models;
using EduTracker.Application.Models;

namespace EduTracker.Api.Extensions.Responses;

public static class OperationResultExtension
{
    extension<T>(OperationResult<T> result)
    {
        public ApiResponse<T> ToApiResponse()
        {
            return new ApiResponse<T>(
                Success: true,
                MessageId: result.MessageId,
                Message: result.Message,
                Details: result.Details,
                Data: result.Data
            );
        }
    }
}
