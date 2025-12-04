using System.Text.Json;
using EduTracker.Exceptions;
using EduTracker.Extensions.Responses;
using EduTracker.Models;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;

namespace EduTracker.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IOptions<JsonOptions> jsonOptions)
{
    private readonly RequestDelegate _next = next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger = logger;
    private readonly JsonSerializerOptions _jsonOptions = jsonOptions.Value.SerializerOptions;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext httpContext, Exception ex)
    {
        ApiResponse<object> response;

        if (ex is AppException appEx)
        {
            httpContext.Response.StatusCode = appEx.StatusCode;
            response = appEx.ToApiResponse<object>(httpContext);

            // Structured warn log
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    "Handled application error | TraceId: {TraceId} | MessageId: {MessageId} | Message: {Message}",
                    response.TraceId,
                    response.MessageId,
                    response.Message
                );
        }
        else
        {
            httpContext.Response.StatusCode = 500;
            response = ex.ToApiResponse<object>(httpContext);

            // Structured error log
            if (_logger.IsEnabled(LogLevel.Error))
                _logger.LogError(
                    ex,
                    "Unhandled server exception | TraceId: {TraceId} | MessageId: {MessageId} | Message: {Message}",
                    response.TraceId,
                    response.MessageId,
                    response.Message
                );
        }

        httpContext.Response.ContentType = "application/json; charset=utf-8";
        // Optional: clear existing response
        httpContext.Response.ContentLength = null;
        string json = JsonSerializer.Serialize(response, _jsonOptions);
        await httpContext.Response.WriteAsync(json);
    }
}
