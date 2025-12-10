using EduTracker.Enums;
using EduTracker.Models;
using FluentValidation;
using FluentValidation.Results;

namespace EduTracker.Extensions.Validations;

public static class ValidationExtensions
{
    extension<T>(IValidator<T> validator)
    {
        public async Task<List<ResponseDetail>> ValidateRequestAsync(T instance, CancellationToken ct = default)
        {
            ValidationResult validation = await validator.ValidateAsync(instance, ct);

            if (validation.IsValid) return [];

            return [.. validation.Errors
                .Select(e =>
                    new ResponseDetail(
                        Message: $"{e.PropertyName}: {e.ErrorMessage}",
                        Severity: ResponseSeverity.Error)
                    )
                ];
        }
    }
}
