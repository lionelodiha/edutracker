using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Tests;

public sealed class OrganizationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("ab")] // shorter than NameMinLength (3)
    [InlineData("Bad!Name")] // '!' is not in the allowed set
    [InlineData(" Leading")] // leading space is not allowed
    [InlineData("Trailing ")] // trailing space is not allowed
    [InlineData("Double  space")] // consecutive spaces are not allowed
    public void Constructor_RejectsInvalidNames(string? name)
    {
        Assert.Throws<ArgumentException>(() => new Organization(name!, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_RejectsTooLongName()
    {
        string tooLong = new('a', OrganizationLimits.NameMaxLength + 1);

        Assert.Throws<ArgumentException>(() => new Organization(tooLong, Guid.NewGuid()));
    }

    [Fact]
    public void Constructor_AcceptsBoundaryLengths()
    {
        var min = new Organization(new string('a', OrganizationLimits.NameMinLength), Guid.NewGuid());
        var max = new Organization(new string('a', OrganizationLimits.NameMaxLength), Guid.NewGuid());

        Assert.Equal(OrganizationLimits.NameMinLength, min.Name.Length);
        Assert.Equal(OrganizationLimits.NameMaxLength, max.Name.Length);
    }

    [Fact]
    public void SetName_SameValue_IsNoOp()
    {
        var org = new Organization("Springfield High", Guid.NewGuid());
        DateTime before = org.UpdatedAt;

        org.SetName("Springfield High");

        Assert.Equal("Springfield High", org.Name);
        Assert.Equal(before, org.UpdatedAt);
    }

    [Fact]
    public void SetName_NewValidValue_Updates()
    {
        var org = new Organization("Old Name", Guid.NewGuid());

        org.SetName("New Name");

        Assert.Equal("New Name", org.Name);
    }

    [Fact]
    public void SetName_InvalidValue_ThrowsAndKeepsOldName()
    {
        var org = new Organization("Old Name", Guid.NewGuid());

        Assert.Throws<ArgumentException>(() => org.SetName("x"));
        Assert.Equal("Old Name", org.Name);
    }

    [Fact]
    public void TransferOwnership_SameOwner_IsNoOp()
    {
        Guid owner = Guid.NewGuid();
        var org = new Organization("Some School", owner);
        DateTime before = org.UpdatedAt;

        org.TransferOwnership(owner);

        Assert.Equal(owner, org.OwnerUserId);
        Assert.Equal(before, org.UpdatedAt);
    }

    [Fact]
    public void Lock_Unlock_AreIdempotent()
    {
        var org = new Organization("Some School", Guid.NewGuid());

        org.Lock();
        Assert.True(org.IsLocked);
        DateTime lockedAt = org.UpdatedAt;

        org.Lock(); // second lock changes nothing
        Assert.True(org.IsLocked);
        Assert.Equal(lockedAt, org.UpdatedAt);

        org.Unlock();
        Assert.False(org.IsLocked);

        DateTime unlockedAt = org.UpdatedAt;
        org.Unlock(); // second unlock changes nothing
        Assert.False(org.IsLocked);
        Assert.Equal(unlockedAt, org.UpdatedAt);
    }
}
