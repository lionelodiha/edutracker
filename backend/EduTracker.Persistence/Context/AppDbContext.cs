using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Billing;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Persistence.Context;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Users
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    // Organizations
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();

    // Security / RBAC
    public DbSet<RbacRole> RbacRoles => Set<RbacRole>();
    public DbSet<RbacPermission> RbacPermissions => Set<RbacPermission>();
    public DbSet<RbacRolePermission> RbacRolePermissions => Set<RbacRolePermission>();
    public DbSet<UserRoleAssignment> UserRoleAssignments => Set<UserRoleAssignment>();
    public DbSet<OrganizationMemberRoleAssignment> OrganizationMemberRoleAssignments => Set<OrganizationMemberRoleAssignment>();

    // Billing
    public DbSet<OrganizationPlan> OrganizationPlans => Set<OrganizationPlan>();
    public DbSet<OrganizationSubscription> OrganizationSubscriptions => Set<OrganizationSubscription>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();

    // Academics
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<ClassOffering> ClassOfferings => Set<ClassOffering>();
    public DbSet<ClassEnrollment> ClassEnrollments => Set<ClassEnrollment>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<GradingScheme> GradingSchemes => Set<GradingScheme>();
    public DbSet<GradingComponent> GradingComponents => Set<GradingComponent>();
    public DbSet<GradeScale> GradeScales => Set<GradeScale>();
    public DbSet<GradeScaleItem> GradeScaleItems => Set<GradeScaleItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
        => modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
