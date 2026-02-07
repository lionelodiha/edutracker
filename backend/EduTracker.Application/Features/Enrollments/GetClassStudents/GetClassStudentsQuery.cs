using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Enrollments.GetClassStudents;

public sealed record GetClassStudentsQuery(
    Guid? ActorId,
    Guid ClassId
) : IMessage<OperationResult<IReadOnlyList<OrganizationMemberResponse>>>;
