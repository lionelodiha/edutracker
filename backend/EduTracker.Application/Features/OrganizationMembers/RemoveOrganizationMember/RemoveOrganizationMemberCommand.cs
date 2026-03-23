using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationMembers.RemoveOrganizationMember;

public sealed record RemoveOrganizationMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid MemberId
) : IMessage<OperationResult<object>>;
