using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationInvites.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationInvites.GetOrganizationInvites;

public sealed record GetOrganizationInvitesQuery(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<IReadOnlyList<OrganizationInviteResponse>>>;
