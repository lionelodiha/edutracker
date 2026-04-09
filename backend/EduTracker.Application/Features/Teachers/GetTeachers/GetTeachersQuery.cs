using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Teachers.GetTeachers;

public sealed record GetTeachersQuery(
    Guid? UserId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<TeacherResponse>>>;
