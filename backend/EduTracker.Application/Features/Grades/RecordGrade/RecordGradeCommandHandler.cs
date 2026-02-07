using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Exceptions;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Grades.RecordGrade;

public sealed class RecordGradeCommandHandler(
    AppDbContext db
) : IHandler<RecordGradeCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(RecordGradeCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        Assignment assignment = await db.Assignments
            .Include(a => a.Class)
            .FirstOrDefaultAsync(a => a.Id == message.AssignmentId, cancellationToken)
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == assignment.Class.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active ||
            (actor.Role != OrganizationMemberRole.Admin && actor.Role != OrganizationMemberRole.Teacher))
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        if (message.Score < 0 || message.Score > assignment.MaxScore)
            throw new AppException("GRADE_INVALID_SCORE", 400, "Score is out of range.");

        OrganizationMember? student = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == message.StudentMemberId && m.OrganizationId == assignment.Class.OrganizationId, cancellationToken);

        if (student is null || student.Role != OrganizationMemberRole.Student)
            throw ResponseCatalog.Organization.MemberNotFound.ToException();

        bool enrolled = await db.ClassEnrollments
            .AsNoTracking()
            .AnyAsync(e => e.ClassId == assignment.ClassId && e.StudentMemberId == student.Id, cancellationToken);

        if (!enrolled)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        Grade? grade = await db.Grades
            .FirstOrDefaultAsync(g => g.AssignmentId == assignment.Id && g.StudentMemberId == student.Id, cancellationToken);

        if (grade is null)
        {
            grade = new Grade(assignment.Id, student.Id, message.Score);
            db.Grades.Add(grade);
        }
        else
        {
            grade.UpdateScore(message.Score);
        }

        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Grade.Recorded
            .As<Guid>()
            .WithData(grade.Id)
            .ToOperationResult();
    }
}
