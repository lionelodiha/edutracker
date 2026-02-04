using System.Text.Json;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.Exceptions;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;

namespace EduTracker.Api.Middleware;

internal sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger,
    IOptions<JsonOptions> jsonOptions
)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await next(httpContext);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(httpContext, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext httpContext, Exception ex)
    {
        ApiResponse<object> response;
        string traceId = httpContext.TraceIdentifier;

        if (ex is AppException appEx)
        {
            httpContext.Response.StatusCode = appEx.StatusCode;
            response = appEx.ToApiResponse<object>();

            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning(
                    "Handled application error | TraceId: {TraceId} | MessageId: {MessageId}",
                    traceId,
                    response.MessageId
                );
        }
        else
        {
            httpContext.Response.StatusCode = 500;
            response = ex.ToApiResponse<object>();

            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(
                    ex,
                    "Unhandled server exception | TraceId: {TraceId} | MessageId: {MessageId}",
                    traceId,
                    response.MessageId
                );
        }

        httpContext.Response.ContentType = "application/json; charset=utf-8";
        string json = JsonSerializer.Serialize(response, jsonOptions.Value.SerializerOptions);
        await httpContext.Response.WriteAsync(json);
    }
}
