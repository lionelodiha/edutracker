using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Organizations.CreateOrganization;

public sealed record CreateOrganizationCommand(
    Guid? OwnerUserId,
    string Name
) : IMessage<OperationResult<Guid>>;
