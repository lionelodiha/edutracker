using System.Net;

namespace EduTracker.Application.Constants.Http;

internal static class HttpStatusCodes
{
    public const int Unauthorized = (int)HttpStatusCode.Unauthorized;
    public const int Forbidden = (int)HttpStatusCode.Forbidden;
    public const int NotFound = (int)HttpStatusCode.NotFound;
    public const int Conflict = (int)HttpStatusCode.Conflict;
}
