namespace EduTracker.Application.Configurations.Caching;

public sealed record CacheTimeToLiveOptions
{
    public CacheOptions AuthSessionById { get; init; } = default!;
    public CacheOptions UserAuthenticationState { get; init; } = default!;
    public CacheOptions UserProfileById { get; init; } = default!;
    public CacheOptions OrganizationById { get; init; } = default!;
    public CacheOptions OrganizationMembers { get; init; } = default!;
    public CacheOptions CourseById { get; init; } = default!;
    public CacheOptions Courses { get; init; } = default!;
    public CacheOptions SemesterById { get; init; } = default!;
    public CacheOptions Semesters { get; init; } = default!;
    public CacheOptions TermById { get; init; } = default!;
    public CacheOptions TermsBySemester { get; init; } = default!;
    public CacheOptions CourseOfferingsBySemester { get; init; } = default!;
}
