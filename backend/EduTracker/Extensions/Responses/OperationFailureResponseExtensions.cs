using EduTracker.Common.Responses;
using EduTracker.Exceptions;

namespace EduTracker.Extensions.Responses;

public static class OperationFailureResponseExtensions
{
    extension(OperationFailureResponse response)
    {
        public AppException ToException() => new(response);
    }
}