using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Students.GetStudentById;

public sealed record GetStudentByIdQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid StudentId
) : IMessage<OperationResult<StudentResponse>>;
