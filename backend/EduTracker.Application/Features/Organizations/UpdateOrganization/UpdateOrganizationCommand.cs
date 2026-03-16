using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.UpdateOrganization;

public sealed record UpdateOrganizationCommand(
    Guid? ActorId,
    Guid OrganizationId,
    string Name
) : IMessage<OperationResult<object>>;
