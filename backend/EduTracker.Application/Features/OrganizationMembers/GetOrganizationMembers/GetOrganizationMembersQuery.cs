using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationMembers.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationMembers.GetOrganizationMembers;

public sealed record GetOrganizationMembersQuery(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<OrganizationMemberResponse>>>;
