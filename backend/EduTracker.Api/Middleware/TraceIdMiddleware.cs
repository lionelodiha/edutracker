namespace EduTracker.Api.Middleware;

internal class TraceIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        string traceId = httpContext.TraceIdentifier;

        httpContext.Response.OnStarting(() =>
        {
            httpContext.Response.Headers["X-Trace-Id"] = traceId;
            return Task.CompletedTask;
        });

        await next(httpContext);
    }
}
