using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Grades.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Grades.GetStudentGrades;

public sealed class GetStudentGradesQueryHandler(
    AppDbContext db
) : IHandler<GetStudentGradesQuery, OperationResult<IReadOnlyList<GradeResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<GradeResponse>>> Handle(GetStudentGradesQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? student = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == message.StudentMemberId, cancellationToken);

        if (student is null)
            throw ResponseCatalog.Organization.MemberNotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .Include(m => m.RoleAssignments)
            .ThenInclude(ra => ra.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == student.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        bool canView = actor.HasRole(RoleKeys.OrganizationAdmin) ||
            actor.HasRole(RoleKeys.Teacher) ||
            actor.Id == student.Id;

        if (!canView)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        List<GradeResponse> grades = await db.Grades
            .AsNoTracking()
            .Where(g => g.StudentMemberId == student.Id)
            .Select(g => g.ToGradeResponse())
            .ToListAsync(cancellationToken);

        return ResponseCatalog.Grade.Retrieved
            .As<IReadOnlyList<GradeResponse>>()
            .WithData(grades)
            .ToOperationResult();
    }
}
