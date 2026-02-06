namespace EduTracker.Application.Models;

public sealed record CursorPage<T>(
    IReadOnlyList<T> Items,
    Guid? NextCursor,
    bool HasMore
);
