using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.OrganizationInvites.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.OrganizationInvites.GetUserInvites;

public sealed record GetUserInvitesQuery(
    Guid? UserId
) : IMessage<OperationResult<IReadOnlyList<UserOrganizationInviteResponse>>>;
