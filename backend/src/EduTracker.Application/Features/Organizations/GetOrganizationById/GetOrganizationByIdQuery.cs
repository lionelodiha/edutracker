using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.GetOrganizationById;

public sealed record GetOrganizationByIdQuery(
    Guid? UserId,
    Guid OrganizationId
) : IMessage<OperationResult<OrganizationResponse>>;
