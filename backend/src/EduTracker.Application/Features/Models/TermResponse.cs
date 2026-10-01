namespace EduTracker.Application.Features.Models;

public sealed record TermResponse(
    Guid Id,
    Guid SemesterId,
    int Ordinal,
    int SemesterStartYear,
    Guid OrganizationId,
    DateTime CreatedAt
)
{
    public int SemesterEndYear => SemesterStartYear + 1;
    public string Session => $"{SemesterStartYear}/{SemesterEndYear}";
}
