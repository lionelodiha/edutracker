using EduTracker.Domain.Entities.Organizations;

namespace EduTracker.Domain.Tests;

public sealed class OrganizationMemberTests
{
    private static OrganizationMember CreateValid()
        => new(Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Constructor_DefaultsToMemberAndActive()
    {
        OrganizationMember member = CreateValid();

        Assert.Equal(OrganizationMemberRole.Member, member.Role);
        Assert.Equal(OrganizationMemberStatus.Active, member.Status);
    }

    [Fact]
    public void UpdateRole_UndefinedValue_Throws()
    {
        OrganizationMember member = CreateValid();

        Assert.Throws<ArgumentException>(() => member.UpdateRole((OrganizationMemberRole)999));
        Assert.Equal(OrganizationMemberRole.Member, member.Role);
    }

    [Fact]
    public void UpdateRole_SameValue_IsNoOp()
    {
        OrganizationMember member = CreateValid();
        DateTime before = member.UpdatedAt;

        member.UpdateRole(OrganizationMemberRole.Member);

        Assert.Equal(before, member.UpdatedAt);
    }

    [Fact]
    public void UpdateRole_NewValue_Updates()
    {
        OrganizationMember member = CreateValid();

        member.UpdateRole(OrganizationMemberRole.Owner);

        Assert.Equal(OrganizationMemberRole.Owner, member.Role);
    }

    [Fact]
    public void UpdateStatus_UndefinedValue_Throws()
    {
        OrganizationMember member = CreateValid();

        Assert.Throws<ArgumentException>(() => member.UpdateStatus((OrganizationMemberStatus)999));
        Assert.Equal(OrganizationMemberStatus.Active, member.Status);
    }

    [Fact]
    public void UpdateStatus_SameValue_IsNoOp()
    {
        OrganizationMember member = CreateValid();
        DateTime before = member.UpdatedAt;

        member.UpdateStatus(OrganizationMemberStatus.Active);

        Assert.Equal(before, member.UpdatedAt);
    }

    [Fact]
    public void AssignToDepartment_SetsBothIds()
    {
        OrganizationMember member = CreateValid();
        Guid facultyId = Guid.NewGuid();
        Guid departmentId = Guid.NewGuid();

        member.AssignToDepartment(facultyId, departmentId);

        Assert.Equal(facultyId, member.FacultyId);
        Assert.Equal(departmentId, member.DepartmentId);
    }
}
