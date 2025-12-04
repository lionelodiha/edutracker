using EduTracker.Common.Responses;
using EduTracker.Models;

namespace EduTracker.Extensions.Responses;

public static class OperationOutcomeResponseExtensions
{
    extension<T>(OperationOutcomeResponse<T> response)
    {
        public OperationResult<T> ToOperationResult()
        {
            NormalizeResponse(response, out string messageId, out string message, out List<ResponseDetail>? details);
            return new OperationResult<T>(messageId, message, details, response.Data);
        }
    }

    extension(OperationOutcomeResponse response)
    {
        public OperationResult<T> ToOperationResult<T>()
        {
            if (response.Data is not null && response.Data is not T)
            {
                throw new InvalidCastException(
                    $"Cannot convert response data from type '{response.Data.GetType().FullName}' to '{typeof(T).FullName}'. " +
                    $"Ensure the response was created with the correct payload or call As<{typeof(T).Name}>() before conversion."
                );
            }

            NormalizeResponse(response, out string messageId, out string message, out List<ResponseDetail>? details);
            return new OperationResult<T>(messageId, message, details, (T?)response.Data);
        }
    }

    private static void NormalizeResponse(IOperationResponse response, out string messageId, out string message, out List<ResponseDetail>? details)
    {
        messageId = string.IsNullOrWhiteSpace(response.Id)
            ? "UNKNOWN_ID"
            : response.Id;

        message = string.IsNullOrWhiteSpace(response.Title)
            ? "No message provided."
            : response.Title;

        details = response.Details is null or { Length: 0 }
            ? null
            : [.. response.Details];
    }
}
