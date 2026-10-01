using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Classes.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.GetClassesByOffering;

public sealed record GetClassesByOfferingQuery(
    Guid OrganizationId,
    Guid CourseOfferingId
) : IMessage<OperationResult<IReadOnlyList<ClassResponse>>>;
