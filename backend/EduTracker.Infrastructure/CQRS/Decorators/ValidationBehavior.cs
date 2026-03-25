using System.Net;
using FluentValidation;
using FluentValidation.Results;
using EduTracker.Application.CQRS.Decorators;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Models;

namespace EduTracker.Infrastructure.CQRS.Decorators;

internal sealed class ValidationBehavior<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IMessage<TResponse>
{
    private const int _statusCode = (int)HttpStatusCode.BadRequest;

    public async Task<TResponse> Handle(TRequest request, Func<Task<TResponse>> next, CancellationToken cancellationToken = default)
    {
        if (validators.Any())
        {
            IEnumerable<Task<ValidationResult>> validationTasks = validators.Select(
                v => v.ValidateAsync(request, cancellationToken)
            );

            ValidationResult[] validationResults = await Task.WhenAll(validationTasks);

            List<ResponseDetail> failures = [.. validationResults
                .SelectMany(r => r.Errors)
                .Where(f => f is not null)
                .Select(f => new ResponseDetail(
                    Message: f.ErrorMessage,
                    Severity: ResponseSeverity.Error
                ))
            ];

            if (failures.Count > 0)
                throw new AppException(
                    id: "COMMON_VALIDATION_FAILED",
                    statusCode: _statusCode,
                    title: "One or more validation errors occurred.",
                    details: [.. failures]
                );
        }

        return await next();
    }
}
