using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Departments.DeleteDepartment;

public sealed record DeleteDepartmentCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid DepartmentId
) : IMessage<OperationResult<object>>;
