namespace EduTracker.Extensions.Validations;

public static class StringExtensions
{
    extension(string value)
    {
        public string EnsureNotEmptyAndTrim()
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException($"{nameof(value)} cannot be empty.", nameof(value));

            return value.Trim();
        }
    }
}
