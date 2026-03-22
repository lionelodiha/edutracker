using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Academics.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Semesters.GetSemesters;

public sealed record GetSemestersQuery(
    Guid? UserId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<SemesterResponse>>>;
