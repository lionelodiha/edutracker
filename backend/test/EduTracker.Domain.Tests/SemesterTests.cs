using EduTracker.Domain.Entities.Academics;

namespace EduTracker.Domain.Tests;

public sealed class SemesterTests
{
    [Fact]
    public void Constructor_CurrentYear_SetsDerivedValues()
    {
        int year = DateTime.UtcNow.Year;

        var semester = new Semester(Guid.NewGuid(), year);

        Assert.Equal(year, semester.StartYear);
        Assert.Equal(year + 1, semester.EndYear);
        Assert.Equal($"{year}/{year + 1}", semester.Session);
    }

    [Fact]
    public void Constructor_TooFarInPast_Throws()
    {
        int tooOld = DateTime.UtcNow.Year - AcademicLimits.MaxPastYears - 1;

        Assert.Throws<ArgumentOutOfRangeException>(() => new Semester(Guid.NewGuid(), tooOld));
    }

    [Fact]
    public void Constructor_TooFarInFuture_Throws()
    {
        int tooNew = DateTime.UtcNow.Year + AcademicLimits.MaxFutureYears + 1;

        Assert.Throws<ArgumentOutOfRangeException>(() => new Semester(Guid.NewGuid(), tooNew));
    }

    [Fact]
    public void Constructor_BoundaryYears_AreAccepted()
    {
        int min = DateTime.UtcNow.Year - AcademicLimits.MaxPastYears;
        int max = DateTime.UtcNow.Year + AcademicLimits.MaxFutureYears;

        var oldest = new Semester(Guid.NewGuid(), min);
        var newest = new Semester(Guid.NewGuid(), max);

        Assert.Equal(min, oldest.StartYear);
        Assert.Equal(max, newest.StartYear);
    }
}
