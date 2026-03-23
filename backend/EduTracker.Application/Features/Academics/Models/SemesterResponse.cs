namespace EduTracker.Application.Features.Academics.Models;

public sealed record SemesterResponse(
    Guid Id,
    int StartYear,
    Guid OrganizationId,
    DateTime CreatedAt
)
{
    public int EndYear => StartYear + 1;
    public string Session => $"{StartYear}/{EndYear}";
}
