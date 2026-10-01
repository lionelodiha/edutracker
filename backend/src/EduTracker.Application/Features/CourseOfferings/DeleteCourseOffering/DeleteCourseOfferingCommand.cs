using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.CourseOfferings.DeleteCourseOffering;

public sealed record DeleteCourseOfferingCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid CourseOfferingId
) : IMessage<OperationResult<object>>;
