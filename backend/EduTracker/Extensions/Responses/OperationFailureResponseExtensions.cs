using EduTracker.Common.Responses;
using EduTracker.Exceptions;

namespace EduTracker.Extensions.Responses;

public static class OperationFailureResponseExtensions
{
    public static AppException ToException(this OperationFailureResponse response) => new(response);
}