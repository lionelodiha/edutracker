using System.Text.RegularExpressions;
using EduTracker.Domain.Abstractions;
using EduTracker.Domain.Components.Auditing;

namespace EduTracker.Domain.Entities.Academics;

public sealed partial class Semester : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Semester() { }

    public Semester(string session, Guid organizationId)
    {
        Session = ValidateSession(session);
        OrganizationId = organizationId;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public string Session { get; private set; } = string.Empty;
    public Guid OrganizationId { get; private set; }

    public void UpdateSession(string session)
    {
        string validatedSession = ValidateSession(session);

        if (Session == validatedSession)
            return;

        Session = validatedSession;
        AuditState.UpdateAudit();
    }

    private static string ValidateSession(string session)
    {
        if (string.IsNullOrWhiteSpace(session))
            throw new ArgumentException("Session is required.", nameof(session));

        session = session.Trim();

        var match = SessionRegex().Match(session);
        if (!match.Success)
            throw new ArgumentException("Session must be in the format 'YYYY/YYYY' or 'YY/YY'.", nameof(session));

        string year1Str = match.Groups[1].Value;
        string year2Str = match.Groups[2].Value;

        if (!int.TryParse(year1Str, out int year1) || !int.TryParse(year2Str, out int year2))
            throw new ArgumentException("Invalid year format in session.", nameof(session));

        if (year1Str.Length != year2Str.Length)
            throw new ArgumentException("Session years must use the same number format.", nameof(session));

        int expectedYear2 = year1Str.Length == 2
            ? (year1 + 1) % 100
            : year1 + 1;

        if (year2 != expectedYear2)
            throw new ArgumentException("The session years must be exactly one year apart (e.g., '2023/2024' or '23/24').", nameof(session));

        return session;
    }

    [GeneratedRegex(@"^(\d{2}|\d{4})/(\d{2}|\d{4})$")]
    private static partial Regex SessionRegex();
}
