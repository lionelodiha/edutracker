using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationMembers.TransferOrganizationOwnership;

public sealed record TransferOrganizationOwnershipCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid MemberId
) : IMessage<OperationResult<object>>;
