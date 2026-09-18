using System.Text.Json;
using EduTracker.Api.Extensions.Responses;
using EduTracker.Api.Models;
using EduTracker.Application.Exceptions;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;

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
        else if (ex is DbUpdateException dbEx && dbEx.InnerException is PostgresException pg)
        {
            // 23502 = not_null_violation, 23503 = foreign_key_violation,
            // 23505 = unique_violation.
            // Log the full detail; return something the user can act on.
            // The constraint name stays in the log — it leaks schema detail.
            logger.LogWarning(dbEx,
                "Database constraint {SqlState} on {Constraint}", pg.SqlState, pg.ConstraintName);

            (string messageId, string message, int statusCode) = pg.SqlState switch
            {
                "23502" => ("SYSTEM_MISSING_REQUIRED_FIELD", "A required field was missing.", StatusCodes.Status400BadRequest),
                "23503" => ("SYSTEM_RELATED_RECORD_NOT_FOUND", "A related record was not found.", StatusCodes.Status404NotFound),
                "23505" => ("SYSTEM_DUPLICATE_RECORD", "A record with these values already exists.", StatusCodes.Status409Conflict),
                _ => ("COMMON_UNKNOWN_ERROR", "An unexpected error occurred. Please try again later.", StatusCodes.Status500InternalServerError),
            };

            httpContext.Response.StatusCode = statusCode;
            response = new ApiResponse<object>(
                Success: false,
                MessageId: messageId,
                Message: message,
                Details: null,
                Data: default
            );
        }
        else
        {
            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
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
