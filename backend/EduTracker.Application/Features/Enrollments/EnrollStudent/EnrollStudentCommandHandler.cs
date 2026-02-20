using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Enrollments.EnrollStudent;

public sealed class EnrollStudentCommandHandler(
    AppDbContext db
) : IHandler<EnrollStudentCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(EnrollStudentCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var classEntity = await db.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == message.ClassId, cancellationToken)
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == classEntity.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active ||
            (!actor.HasRole(RoleKeys.OrganizationAdmin) && !actor.HasRole(RoleKeys.Teacher)))
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember? student = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == message.StudentMemberId && m.OrganizationId == classEntity.OrganizationId, cancellationToken);

        if (student is null || !student.HasRole(RoleKeys.Student) || student.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Organization.MemberNotFound.ToException();

        bool exists = await db.ClassEnrollments
            .AnyAsync(e => e.ClassId == classEntity.Id && e.StudentMemberId == student.Id, cancellationToken);

        if (exists)
            throw ResponseCatalog.Enrollment.AlreadyEnrolled.ToException();

        ClassEnrollment enrollment = new(
            classId: classEntity.Id,
            studentMemberId: student.Id
        );

        db.ClassEnrollments.Add(enrollment);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Enrollment.Enrolled
            .As<Guid>()
            .WithData(enrollment.Id)
            .ToOperationResult();
    }
}
