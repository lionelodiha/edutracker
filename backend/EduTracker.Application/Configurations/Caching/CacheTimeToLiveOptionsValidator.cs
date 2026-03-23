using Microsoft.Extensions.Options;

namespace EduTracker.Application.Configurations.Caching;

internal sealed class CacheTimeToLiveOptionsValidator : IValidateOptions<CacheTimeToLiveOptions>
{
    public ValidateOptionsResult Validate(string? name, CacheTimeToLiveOptions options)
    {
        List<string> errors = [];

        if (options.AuthSessionById is null || options.AuthSessionById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:AuthSessionById:Minutes must be greater than 0.");

        if (options.UserAuthenticationState is null || options.UserAuthenticationState.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:UserAuthenticationState:Minutes must be greater than 0.");

        if (options.UserProfileById is null || options.UserProfileById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:UserProfileById:Minutes must be greater than 0.");

        if (options.OrganizationById is null || options.OrganizationById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:OrganizationById:Minutes must be greater than 0.");

        if (options.OrganizationMembers is null || options.OrganizationMembers.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:OrganizationMembers:Minutes must be greater than 0.");

        if (options.CourseById is null || options.CourseById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:CourseById:Minutes must be greater than 0.");

        if (options.Courses is null || options.Courses.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:Courses:Minutes must be greater than 0.");

        if (options.SemesterById is null || options.SemesterById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:SemesterById:Minutes must be greater than 0.");

        if (options.Semesters is null || options.Semesters.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:Semesters:Minutes must be greater than 0.");

        if (options.TermById is null || options.TermById.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:TermById:Minutes must be greater than 0.");

        if (options.TermsBySemester is null || options.TermsBySemester.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:TermsBySemester:Minutes must be greater than 0.");

        if (options.CourseOfferingsBySemester is null || options.CourseOfferingsBySemester.Minutes <= 0)
            errors.Add("CacheTimeToLiveOptions:CourseOfferingsBySemester:Minutes must be greater than 0.");

        return errors.Count is 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}
