using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Terms.GetTermById;

public sealed record GetTermByIdQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid TermId
) : IMessage<OperationResult<TermResponse>>;
