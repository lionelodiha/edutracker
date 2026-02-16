using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.GetOrganizationMembers;

public sealed record GetOrganizationMembersQuery(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<OrganizationMemberResponse>>>;
