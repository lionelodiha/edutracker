using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Enrollments.GetClassStudents;

public sealed class GetClassStudentsQueryHandler(
    AppDbContext db
) : IHandler<GetClassStudentsQuery, OperationResult<IReadOnlyList<OrganizationMemberResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<OrganizationMemberResponse>>> Handle(GetClassStudentsQuery message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var classEntity = await db.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == message.ClassId, cancellationToken)
            ?? throw ResponseCatalog.Class.NotFound.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == classEntity.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        List<OrganizationMemberResponse> students = await db.ClassEnrollments
            .AsNoTracking()
            .Where(e => e.ClassId == classEntity.Id)
            .Select(e => e.StudentMember)
            .Select(m => m.ToOrganizationMemberResponse())
            .ToListAsync(cancellationToken);

        return ResponseCatalog.Organization.MembersRetrieved
            .As<IReadOnlyList<OrganizationMemberResponse>>()
            .WithData(students)
            .ToOperationResult();
    }
}
