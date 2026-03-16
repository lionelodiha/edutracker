using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.RemoveOrganizationMember;

public sealed record RemoveOrganizationMemberCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid MemberId
) : IMessage<OperationResult<object>>;
