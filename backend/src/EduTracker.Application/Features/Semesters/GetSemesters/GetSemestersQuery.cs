using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Semesters.GetSemesters;

public sealed record GetSemestersQuery(
    Guid? UserId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<SemesterResponse>>>;
