using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Enums;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Models;
using FluentValidation;
using FluentValidation.Results;
using EduTracker.Application.CQRS.Decorators;
using System.Net;

namespace EduTracker.Infrastructure.CQRS.Decorators;

internal class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, Func<Task<TResponse>> next, CancellationToken cancellationToken = default)
    {
        if (validators.Any())
        {
            IEnumerable<Task<ValidationResult>> validationTasks = validators.Select(v => v.ValidateAsync(request, cancellationToken));
            ValidationResult[] validationResults = await Task.WhenAll(validationTasks);

            List<ResponseDetail> failures = [.. validationResults
                .SelectMany(r => r.Errors)
                .Where(f => f is not null)
                .Select(f => new ResponseDetail($"{f.PropertyName}: {f.ErrorMessage}", ResponseSeverity.Error))
            ];

            if (failures.Count > 0)
            {
                throw new AppException(
                    id: "SYSTEM_VALIDATION_FAILED",
                    statusCode: (int)HttpStatusCode.BadRequest,
                    title: "Validation failed.",
                    details: [.. failures]
                );
            }
        }

        return await next();
    }
}
