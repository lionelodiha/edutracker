using EduTracker.Application.Features.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class AcademicClassExtensions
{
    extension(AcademicClass item)
    {
        public ClassResponse ToClassResponse() => new(
            item.Id,
            item.Name,
            item.Code,
            item.OrganizationId,
            item.CreatedAt
        );
    }
}
