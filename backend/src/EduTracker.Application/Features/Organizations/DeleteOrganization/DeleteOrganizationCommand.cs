using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.DeleteOrganization;

public sealed record DeleteOrganizationCommand(
    Guid? ActorId,
    Guid OrganizationId
) : IMessage<OperationResult<object>>;
