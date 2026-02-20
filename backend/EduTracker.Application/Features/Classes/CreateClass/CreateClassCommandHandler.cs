using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.CreateClass;

public sealed class CreateClassCommandHandler(
    AppDbContext db
) : IHandler<CreateClassCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateClassCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var course = await db.Courses
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == message.CourseId, cancellationToken)
            ?? throw ResponseCatalog.Course.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == course.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || !actor.HasRole(RoleKeys.OrganizationAdmin))
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        OrganizationMember? teacher = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == message.TeacherMemberId && m.OrganizationId == course.OrganizationId, cancellationToken);

        if (teacher is null || !teacher.HasRole(RoleKeys.Teacher))
            throw ResponseCatalog.Organization.MemberNotFound.ToException();

        Class @class = new(
            organizationId: course.OrganizationId,
            courseId: course.Id,
            teacherMemberId: teacher.Id,
            term: message.Term,
            year: message.Year
        );

        db.Classes.Add(@class);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Class.Created
            .As<Guid>()
            .WithData(@class.Id)
            .ToOperationResult();
    }
}
