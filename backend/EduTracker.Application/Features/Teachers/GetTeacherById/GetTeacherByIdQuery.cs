using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Teachers.GetTeacherById;

public sealed record GetTeacherByIdQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid TeacherId
) : IMessage<OperationResult<TeacherResponse>>;
