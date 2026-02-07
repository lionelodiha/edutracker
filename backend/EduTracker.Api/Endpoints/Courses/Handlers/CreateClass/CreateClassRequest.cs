namespace EduTracker.Api.Endpoints.Courses.Handlers.CreateClass;

internal sealed record CreateClassRequest(
    Guid TeacherMemberId,
    string Term,
    int Year
);
