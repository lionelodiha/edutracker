using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Persistence.Context;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<OrganizationInvite> OrganizationInvites => Set<OrganizationInvite>();

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<Term> Terms => Set<Term>();
    public DbSet<CourseOffering> CourseOfferings => Set<CourseOffering>();
    public DbSet<Class> Classes => Set<Class>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
        => modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
