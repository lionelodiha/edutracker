using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.GetOrganizationInvites;

public sealed record GetOrganizationInvitesQuery(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<OrganizationInviteResponse>>>;
