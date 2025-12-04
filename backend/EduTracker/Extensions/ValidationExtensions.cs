using EduTracker.Enums;
using EduTracker.Models;
using FluentValidation;
using FluentValidation.Results;

namespace EduTracker.Extensions;

public static class ValidationExtensions
{
    extension(string value)
    {
        public string ValidateAndTrim()
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"{nameof(value)} cannot be empty.", nameof(value));

            return value.Trim();
        }
    }

    extension<T>(IValidator<T> validator)
    {
        public async Task<List<ResponseDetail>> ValidateRequestAsync(T instance, CancellationToken ct = default)
        {
            ValidationResult validation = await validator.ValidateAsync(instance, ct);

            if (validation.IsValid)
                return [];

            return [.. validation.Errors
                .Select(e => new ResponseDetail($"{e.PropertyName}: {e.ErrorMessage}", ResponseSeverity.Error))];
        }
    }
}
