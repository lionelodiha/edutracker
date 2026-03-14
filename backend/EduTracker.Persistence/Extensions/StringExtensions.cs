using System.Text;

namespace EduTracker.Persistence.Extensions;

internal static class StringExtensions
{
    extension(string value)
    {
        public string ToSnakeCase()
        {
            if (string.IsNullOrWhiteSpace(value))
                return value;

            StringBuilder builder = new(value.Length + 8);

            for (int idx = 0; idx < value.Length; idx++)
            {
                char currentCharacter = value[idx];

                if (char.IsUpper(currentCharacter))
                {
                    if (idx > 0)
                    {
                        char previous = value[idx - 1];
                        bool nextIsLower = idx + 1 < value.Length && char.IsLower(value[idx + 1]);

                        if (previous != '_' && (!char.IsUpper(previous) || nextIsLower))
                            builder.Append('_');
                    }

                    builder.Append(char.ToLowerInvariant(currentCharacter));
                }
                else
                {
                    builder.Append(currentCharacter);
                }
            }

            return builder.ToString();
        }
    }
}
