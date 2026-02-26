using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Application.Features.Organizations.InviteOrganizationMember;

public sealed record InviteOrganizationMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid UserId
) : IMessage<OperationResult<Guid>>;
