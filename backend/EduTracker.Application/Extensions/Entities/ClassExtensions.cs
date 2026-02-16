using EduTracker.Application.Features.Classes.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class ClassExtensions
{
    extension(Class entity)
    {
        public ClassResponse ToClassResponse()
            => new(
                entity.Id,
                entity.OrganizationId,
                entity.CourseId,
                entity.TeacherMemberId,
                entity.Term,
                entity.Year
            );
    }
}
