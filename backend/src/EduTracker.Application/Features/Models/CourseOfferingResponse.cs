namespace EduTracker.Application.Features.Models;

public sealed record CourseOfferingResponse(
    Guid Id,
    Guid CourseId,
    string CourseName,
    string CourseCode,
    Guid SemesterId,
    Guid TermId,
    int TermOrdinal,
    int SemesterStartYear,
    Guid OrganizationId,
    DateTime CreatedAt
)
{
    public int SemesterEndYear => SemesterStartYear + 1;
    public string Session => $"{SemesterStartYear}/{SemesterEndYear}";
}
