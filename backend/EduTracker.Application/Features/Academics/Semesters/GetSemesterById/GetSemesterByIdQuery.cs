using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Semesters.GetSemesterById;

public sealed record GetSemesterByIdQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid SemesterId
) : IMessage<OperationResult<SemesterResponse>>;
