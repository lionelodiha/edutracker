using EduTracker.Common.Entities;

namespace EduTracker.Entities;

public class SchoolMembers : IEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SchoolId { get; private set; }
    public Guid UserId { get; private set; }
    public string Role { get; private set; } = "member"; // owner, admin, teacher, student

    public School School { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private SchoolMembers() { }
    public SchoolMembers(Guid schoolId, Guid userId, string role)
    {
        SchoolId = schoolId;
        UserId = userId;
        Role = role;
    }
}
