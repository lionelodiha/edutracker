using EduTracker.Application.Features.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class TermExtensions
{
    extension(Term term)
    {
        public TermResponse ToTermResponse() => new(
            term.Id,
            term.SemesterId,
            term.Ordinal,
            term.Semester.StartYear,
            term.Semester.OrganizationId,
            term.CreatedAt
        );
    }
}
