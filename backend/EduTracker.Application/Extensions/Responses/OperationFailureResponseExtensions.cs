using EduTracker.Application.Common.Responses;
using EduTracker.Application.Exceptions;

namespace EduTracker.Application.Extensions.Responses;

internal static class OperationFailureResponseExtensions
{
    extension(OperationFailureResponse response)
    {
        public AppException ToException() => new(response);
    }
}
