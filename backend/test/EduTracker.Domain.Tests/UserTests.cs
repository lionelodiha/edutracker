using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Tests;

public sealed class UserTests
{
    private const string ValidUserName = "test.user_1";
    private static readonly string ValidEmailHash = new('a', UserLimits.EmailHashLength);
    private static readonly string ValidPasswordHash = new('b', UserLimits.PasswordHashLength);

    private static User CreateValid() => new(ValidUserName, ValidEmailHash, ValidPasswordHash);

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("ab")] // shorter than UserNameMinLength (3)
    [InlineData("bad name")] // spaces are not allowed
    [InlineData("bad-name")] // hyphens are not allowed by the regex
    public void Constructor_RejectsInvalidUserNames(string? userName)
    {
        Assert.Throws<ArgumentException>(() => new User(userName!, ValidEmailHash, ValidPasswordHash));
    }

    [Fact]
    public void Constructor_RejectsTooLongUserName()
    {
        string tooLong = new('a', UserLimits.UserNameMaxLength + 1);

        Assert.Throws<ArgumentException>(() => new User(tooLong, ValidEmailHash, ValidPasswordHash));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("short")] // must be exactly EmailHashLength (64)
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")] // 65 chars
    public void Constructor_RejectsInvalidEmailHash(string? emailHash)
    {
        Assert.Throws<ArgumentException>(() => new User(ValidUserName, emailHash!, ValidPasswordHash));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("short")] // must be exactly PasswordHashLength (60)
    public void Constructor_RejectsInvalidPasswordHash(string? passwordHash)
    {
        Assert.Throws<ArgumentException>(() => new User(ValidUserName, ValidEmailHash, passwordHash!));
    }

    [Fact]
    public void SetUserName_SameValue_IsNoOp()
    {
        User user = CreateValid();
        DateTime before = user.UpdatedAt;

        user.SetUserName(ValidUserName);

        Assert.Equal(ValidUserName, user.UserName);
        Assert.Equal(before, user.UpdatedAt);
    }

    [Fact]
    public void SetEmailHash_SameValue_IsNoOp()
    {
        User user = CreateValid();
        DateTime before = user.UpdatedAt;

        user.SetEmailHash(ValidEmailHash);

        Assert.Equal(before, user.UpdatedAt);
    }

    [Fact]
    public void SetPasswordHash_SameValue_IsNoOp()
    {
        User user = CreateValid();
        DateTime before = user.UpdatedAt;

        user.SetPasswordHash(ValidPasswordHash);

        Assert.Equal(before, user.UpdatedAt);
    }

    [Fact]
    public void UpdateRole_UndefinedValue_Throws()
    {
        User user = CreateValid();

        Assert.Throws<ArgumentException>(() => user.UpdateRole((UserRole)999));
        Assert.Equal(UserRole.User, user.Role);
    }

    [Fact]
    public void UpdateRole_SameValue_IsNoOp()
    {
        User user = CreateValid();
        DateTime before = user.UpdatedAt;

        user.UpdateRole(UserRole.User);

        Assert.Equal(before, user.UpdatedAt);
    }

    [Fact]
    public void SetEncryptedData_NullOrEmpty_Throws()
    {
        User user = CreateValid();

        Assert.Throws<ArgumentNullException>(() => user.SetEncryptedData(null!));
        Assert.Throws<ArgumentException>(() => user.SetEncryptedData([]));
    }

    [Fact]
    public void Lock_Unlock_AreIdempotent()
    {
        User user = CreateValid();

        user.Lock();
        Assert.True(user.IsLocked);
        DateTime lockedAt = user.UpdatedAt;

        user.Lock();
        Assert.Equal(lockedAt, user.UpdatedAt);

        user.Unlock();
        Assert.False(user.IsLocked);

        DateTime unlockedAt = user.UpdatedAt;
        user.Unlock();
        Assert.Equal(unlockedAt, user.UpdatedAt);
    }
}
