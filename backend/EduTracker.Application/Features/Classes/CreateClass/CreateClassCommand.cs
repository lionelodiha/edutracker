using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Classes.CreateClass;

public sealed record CreateClassCommand(
    Guid? ActorId,
    Guid CourseId,
    Guid TeacherMemberId,
    string Term,
    int Year
) : IMessage<OperationResult<Guid>>;
