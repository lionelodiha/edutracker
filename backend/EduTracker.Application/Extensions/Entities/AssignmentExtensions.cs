using EduTracker.Application.Features.Assignments.Models;
using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Application.Extensions.Entities;

internal static class AssignmentExtensions
{
    extension(Assignment assignment)
    {
        public AssignmentResponse ToAssignmentResponse()
            => new(
                assignment.Id,
                assignment.ClassId,
                assignment.Title,
                assignment.MaxScore,
                assignment.DueDate
            );
    }
}
