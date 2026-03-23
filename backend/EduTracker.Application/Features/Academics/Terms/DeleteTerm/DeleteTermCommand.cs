using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Terms.DeleteTerm;

public sealed record DeleteTermCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid TermId
) : IMessage<OperationResult<object>>;
