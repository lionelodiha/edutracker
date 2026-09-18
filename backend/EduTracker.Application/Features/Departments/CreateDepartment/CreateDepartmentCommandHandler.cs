using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Departments.CreateDepartment;

internal sealed class CreateDepartmentCommandHandler(
    AppDbContext db
) : IHandler<CreateDepartmentCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateDepartmentCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        var organizationState = await db.Organizations
            .AsNoTracking()
            .Where(item => item.Id == message.OrganizationId)
            .Select(item => new { item.IsLocked })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        if (organizationState.IsLocked)
            throw ResponseCatalog.Organization.Locked.ToException();

        bool canManage = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.UserId == message.ActorId.Value
                    && item.Status == OrganizationMemberStatus.Active
                    && (item.Role == OrganizationMemberRole.Owner || item.Role == OrganizationMemberRole.Moderator),
                cancellationToken
            );

        if (!canManage)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        // Case-insensitive duplicate check within the org.
        string normalizedName = message.Name.Trim();
        string lowerName = normalizedName.ToLower();

        bool exists = await db.Departments
            .AsNoTracking()
            .AnyAsync(
                d => d.OrganizationId == message.OrganizationId
                    && d.Name.ToLower() == lowerName,
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Department.AlreadyExists.ToException();

        // If a faculty was supplied, it must belong to THIS organization. Skipping
        // this lets a caller attach a department to another school's faculty.
        // Guid.Empty is treated as "no faculty supplied" for old clients that
        // still send the default value instead of omitting the field.
        Guid? facultyId = message.FacultyId == Guid.Empty ? null : message.FacultyId;

        if (facultyId is not null)
        {
            bool facultyBelongs = await db.Faculties
                .AsNoTracking()
                .AnyAsync(
                    f => f.Id == facultyId.Value
                        && f.OrganizationId == message.OrganizationId,
                    cancellationToken
                );

            if (!facultyBelongs)
                throw ResponseCatalog.Department.FacultyNotFound.ToException();
        }

        Department department = new(message.OrganizationId, facultyId, normalizedName, message.Description);

        db.Departments.Add(department);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Department.Created
            .As<Guid>()
            .WithData(department.Id)
            .ToOperationResult();
    }
}
