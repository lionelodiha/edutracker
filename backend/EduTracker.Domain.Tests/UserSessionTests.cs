using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Tests;

public sealed class UserSessionTests
{
    private static UserSession CreateValid()
        => new(Guid.NewGuid(), rememberMe: false, TimeSpan.FromHours(8), TimeSpan.FromDays(90));

    [Fact]
    public void Constructor_NonPositiveSlidingLifetime_Throws()
    {
        Assert.Throws<ArgumentException>(() =>
            new UserSession(Guid.NewGuid(), false, TimeSpan.Zero, TimeSpan.FromDays(1)));
        Assert.Throws<ArgumentException>(() =>
            new UserSession(Guid.NewGuid(), false, TimeSpan.FromHours(-1), TimeSpan.FromDays(1)));
    }

    [Fact]
    public void Constructor_AbsoluteShorterThanSliding_Throws()
    {
        Assert.Throws<ArgumentException>(() =>
            new UserSession(Guid.NewGuid(), false, TimeSpan.FromHours(8), TimeSpan.FromHours(1)));
    }

    [Fact]
    public void Constructor_SetsExpirationsFromNow()
    {
        DateTime before = DateTime.UtcNow;

        var session = new UserSession(Guid.NewGuid(), false, TimeSpan.FromHours(8), TimeSpan.FromDays(90));

        Assert.True(session.ExpiresAt >= before.AddHours(8));
        Assert.True(session.AbsoluteExpiresAt >= before.AddDays(90));
        Assert.False(session.IsRevoked);
        Assert.False(session.IsExpired());
    }

    [Fact]
    public void Revoke_IsIdempotent()
    {
        UserSession session = CreateValid();

        session.Revoke();
        Assert.True(session.IsRevoked);
        Assert.NotNull(session.RevokedAt);
        Assert.True(session.IsExpired()); // revoked counts as expired
        DateTime revokedAt = session.RevokedAt!.Value;

        session.Revoke(); // second revoke changes nothing
        Assert.Equal(revokedAt, session.RevokedAt);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(101)]
    public void ShouldRefresh_OutOfRangeThreshold_Throws(double threshold)
    {
        UserSession session = CreateValid();

        Assert.Throws<ArgumentOutOfRangeException>(() => session.ShouldRefresh(threshold));
    }

    [Fact]
    public void ShouldRefresh_RevokedSession_ReturnsFalse()
    {
        UserSession session = CreateValid();
        session.Revoke();

        Assert.False(session.ShouldRefresh(50));
    }

    [Fact]
    public void ExtendSession_RevokedSession_IsNoOp()
    {
        UserSession session = CreateValid();
        DateTime expiresAt = session.ExpiresAt;
        session.Revoke();

        session.ExtendSession(TimeSpan.FromHours(8));

        Assert.Equal(expiresAt, session.ExpiresAt);
    }
}
