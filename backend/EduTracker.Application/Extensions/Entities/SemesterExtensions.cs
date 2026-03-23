using EduTracker.Application.Features.Academics.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class SemesterExtensions
{
    extension(Semester semester)
    {
        public SemesterResponse ToSemesterResponse() => new(
            semester.Id,
            semester.StartYear,
            semester.OrganizationId,
            semester.CreatedAt
        );
    }
}
