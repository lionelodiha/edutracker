using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Departments.CreateDepartment;

public sealed record CreateDepartmentCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid? FacultyId,
    string Name,
    string? Description
) : IMessage<OperationResult<Guid>>;
