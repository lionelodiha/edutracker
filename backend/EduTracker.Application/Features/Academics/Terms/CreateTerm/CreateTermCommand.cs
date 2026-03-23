using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.Terms.CreateTerm;

public sealed record CreateTermCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid SemesterId,
    int Ordinal
) : IMessage<OperationResult<Guid>>;
