using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Terms.GetTermsBySemester;

public sealed record GetTermsBySemesterQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid SemesterId
) : IMessage<OperationResult<IReadOnlyList<TermResponse>>>;
