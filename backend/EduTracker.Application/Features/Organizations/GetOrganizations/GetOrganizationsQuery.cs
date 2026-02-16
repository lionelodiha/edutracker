using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.GetOrganizations;

public sealed record GetOrganizationsQuery(
    Guid? UserId
) : IMessage<OperationResult<IReadOnlyList<OrganizationListItemResponse>>>;
