using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Academics.CourseOfferings.CreateCourseOffering;

public sealed record CreateCourseOfferingCommand(
    Guid? ActorId,
    Guid OrganizationId,
    Guid CourseId,
    Guid TermId
) : IMessage<OperationResult<Guid>>;
