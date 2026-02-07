using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.GetClassById;

public sealed record GetClassByIdQuery(
    Guid? ActorId,
    Guid ClassId
) : IMessage<OperationResult<ClassResponse>>;
