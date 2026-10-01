using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Models;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Organizations;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Departments.GetDepartments;

internal sealed class GetDepartmentsQueryHandler(
    AppDbContext db
) : IHandler<GetDepartmentsQuery, OperationResult<IReadOnlyList<DepartmentResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<DepartmentResponse>>> Handle(GetDepartmentsQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool isActiveMember = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(
                item => item.OrganizationId == message.OrganizationId
                    && item.UserId == message.UserId.Value
                    && item.Status == OrganizationMemberStatus.Active,
                cancellationToken
            );

        if (!isActiveMember)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        List<DepartmentResponse> departments = await db.Departments
            .AsNoTracking()
            .Where(item => item.OrganizationId == message.OrganizationId)
            .OrderBy(item => item.Name)
            .Select(item => new DepartmentResponse(
                item.Id,
                item.Name,
                item.Description,
                item.OrganizationId,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return ResponseCatalog.Department.Retrieved
            .As<IReadOnlyList<DepartmentResponse>>()
            .WithData(departments)
            .ToOperationResult();
    }
}
