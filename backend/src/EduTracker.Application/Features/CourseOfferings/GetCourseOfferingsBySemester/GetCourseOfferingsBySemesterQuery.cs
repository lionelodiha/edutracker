using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.CourseOfferings.GetCourseOfferingsBySemester;

public sealed record GetCourseOfferingsBySemesterQuery(
    Guid? UserId,
    Guid OrganizationId,
    Guid SemesterId
) : IMessage<OperationResult<IReadOnlyList<CourseOfferingResponse>>>;
