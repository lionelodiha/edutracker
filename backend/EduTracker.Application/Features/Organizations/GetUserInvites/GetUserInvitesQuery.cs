using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.GetUserInvites;

public sealed record GetUserInvitesQuery(
    Guid? UserId
) : IMessage<OperationResult<IReadOnlyList<UserOrganizationInviteResponse>>>;
