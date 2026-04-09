using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.GetClassById;

public sealed record GetClassByIdQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid ClassId
) : IMessage<OperationResult<ClassResponse>>;
