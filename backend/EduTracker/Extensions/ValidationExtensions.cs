using EduTracker.Enums;
using EduTracker.Models;
using FluentValidation;
using FluentValidation.Results;

namespace EduTracker.Extensions;

public static class ValidationExtensions
{
    public static string ValidateAndTrim(this string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException($"{nameof(value)} cannot be empty.", nameof(value));

        return value.Trim();
    }

    public static async Task<List<ResponseDetail>> ValidateRequestAsync<T>(this IValidator<T> validator, T instance, CancellationToken ct = default)
    {
        ValidationResult validation = await validator.ValidateAsync(instance, ct);

        if (validation.IsValid)
            return new List<ResponseDetail>();

        return validation.Errors
            .Select(e => new ResponseDetail($"{e.PropertyName}: {e.ErrorMessage}", ResponseSeverity.Error))
            .ToList();
    }
}