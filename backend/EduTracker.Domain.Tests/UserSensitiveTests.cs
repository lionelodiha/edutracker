using EduTracker.Domain.Entities.Users;

namespace EduTracker.Domain.Tests;

public sealed class UserSensitiveTests
{
    [Fact]
    public void Create_TrimsAndLowercasesEmail()
    {
        UserSensitive sensitive = UserSensitive.Create("Ada", null, "Lovelace", "Ada@Example.COM");

        Assert.Equal("Ada", sensitive.FirstName);
        Assert.Null(sensitive.MiddleName);
        Assert.Equal("Lovelace", sensitive.LastName);
        Assert.Equal("ada@example.com", sensitive.Email);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    [InlineData("missing-at.example.com")]
    public void Create_RejectsInvalidEmail(string? email)
    {
        Assert.Throws<ArgumentException>(() => UserSensitive.Create("Ada", null, "Lovelace", email!));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Bad123")] // digits are not allowed in names
    public void Create_RejectsInvalidFirstName(string? firstName)
    {
        Assert.Throws<ArgumentException>(() => UserSensitive.Create(firstName!, null, "Lovelace", "ada@example.com"));
    }

    [Fact]
    public void Create_OptionalMiddleName_MayBeNull()
    {
        UserSensitive sensitive = UserSensitive.Create("Ada", null, "Lovelace", "ada@example.com");

        Assert.Null(sensitive.MiddleName);
    }

    [Fact]
    public void Create_InvalidMiddleName_Throws()
    {
        Assert.Throws<ArgumentException>(() => UserSensitive.Create("Ada", "Bad123", "Lovelace", "ada@example.com"));
    }

    [Fact]
    public void UpdateName_ValidatesLikeCreate()
    {
        UserSensitive sensitive = UserSensitive.Create("Ada", null, "Lovelace", "ada@example.com");

        Assert.Throws<ArgumentException>(() => sensitive.UpdateName("", null, "Lovelace"));
        Assert.Equal("Ada", sensitive.FirstName);

        sensitive.UpdateName("Grace", "Murray", "Hopper");

        Assert.Equal("Grace", sensitive.FirstName);
        Assert.Equal("Murray", sensitive.MiddleName);
        Assert.Equal("Hopper", sensitive.LastName);
    }
}
