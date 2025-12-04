using EduTracker.Models;

namespace EduTracker.Extensions.Responses;

public static class OperationResultExtension
{
    extension<T>(OperationResult<T> result)
    {
        public ApiResponse<T> ToApiResponse()
        {
            return new ApiResponse<T>(null, true, result.MessageId, result.Message, result.Details, result.Data);
        }
    }
}
