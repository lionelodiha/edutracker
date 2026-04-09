namespace EduTracker.Application.Constants.Cache;

internal static class CacheKeys
{
    public static string SessionById(Guid sessionId)
        => $"edu:session:id:{sessionId:N}";

    public static string UserAuthenticationState(Guid userId)
        => $"edu:auth:user:authentication:{userId:N}";

    public static string UserProfileById(Guid userId)
        => $"edu:user:profile:by-id:{userId:N}";

    public static string OrganizationById(Guid organizationId)
        => $"edu:organization:by-id:{organizationId:N}";

    public static string OrganizationMembers(Guid organizationId)
        => $"edu:organization:members:{organizationId:N}";

    public static string CourseById(Guid courseId)
        => $"edu:course:by-id:{courseId:N}";

    public static string Courses(Guid organizationId)
        => $"edu:courses:organization:{organizationId:N}";

    public static string ClassById(Guid classId)
        => $"edu:class:by-id:{classId:N}";

    public static string Classes(Guid organizationId)
        => $"edu:classes:organization:{organizationId:N}";

    public static string TeacherById(Guid teacherId)
        => $"edu:teacher:by-id:{teacherId:N}";

    public static string Teachers(Guid organizationId)
        => $"edu:teachers:organization:{organizationId:N}";

    public static string StudentById(Guid studentId)
        => $"edu:student:by-id:{studentId:N}";

    public static string Students(Guid organizationId)
        => $"edu:students:organization:{organizationId:N}";

    public static string SemesterById(Guid semesterId)
        => $"edu:semester:by-id:{semesterId:N}";

    public static string Semesters(Guid organizationId)
        => $"edu:semesters:organization:{organizationId:N}";

    public static string TermById(Guid termId)
        => $"edu:term:by-id:{termId:N}";

    public static string TermsBySemester(Guid semesterId)
        => $"edu:terms:semester:{semesterId:N}";

    public static string CourseOfferingsBySemester(Guid semesterId)
        => $"edu:course-offerings:semester:{semesterId:N}";
}
