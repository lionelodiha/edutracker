using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.GetOrganizations;

internal sealed class GetOrganizationsQueryHandler(
    AppDbContext db
) : IHandler<GetOrganizationsQuery, OperationResult<IReadOnlyList<OrganizationListItemResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<OrganizationListItemResponse>>> Handle(GetOrganizationsQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        List<OrganizationListItemResponse> organizations = await db.OrganizationMembers
            .AsNoTracking()
            .Where(m => m.UserId == message.UserId.Value)
            .Select(m => new OrganizationListItemResponse(
                m.OrganizationId,
                m.Organization.Name,
                m.Role,
                m.Status
            ))
            .ToListAsync(cancellationToken);

        return ResponseCatalog.Organization.Retrieved
            .As<IReadOnlyList<OrganizationListItemResponse>>()
            .WithData(organizations)
            .ToOperationResult();
    }
}
