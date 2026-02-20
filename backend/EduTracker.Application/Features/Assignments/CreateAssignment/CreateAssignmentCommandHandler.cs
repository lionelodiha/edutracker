using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Security;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Assignments.CreateAssignment;

public sealed class CreateAssignmentCommandHandler(
    AppDbContext db
) : IHandler<CreateAssignmentCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateAssignmentCommand message, CancellationToken cancellationToken = default)
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

        Assignment assignment = new(
            classId: classEntity.Id,
            title: message.Title,
            maxScore: message.MaxScore,
            dueDate: message.DueDate
        );

        db.Assignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Assignment.Created
            .As<Guid>()
            .WithData(assignment.Id)
            .ToOperationResult();
    }
}
