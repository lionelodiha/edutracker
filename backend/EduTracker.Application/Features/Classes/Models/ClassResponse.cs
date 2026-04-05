namespace EduTracker.Application.Features.Classes.Models;

public sealed record ClassResponse(
    Guid Id,
    Guid CourseOfferingId,
    string Code,
    Guid? InstructorId,
    string? InstructorName,
    int MaxCapacity,
    DateTime CreatedAt
);
