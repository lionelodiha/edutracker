using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Entities;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Organizations.Models;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Organizations.GetOrganizationById;

public sealed class GetOrganizationByIdQueryHandler(
    AppDbContext db
) : IHandler<GetOrganizationByIdQuery, OperationResult<OrganizationResponse>>
{
    public async Task<OperationResult<OrganizationResponse>> Handle(GetOrganizationByIdQuery message, CancellationToken cancellationToken = default)
    {
        if (message.UserId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        bool isMember = await db.OrganizationMembers
            .AsNoTracking()
            .AnyAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.UserId.Value, cancellationToken);

        if (!isMember)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        var organization = await db.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == message.OrganizationId, cancellationToken)
            ?? throw ResponseCatalog.Organization.NotFound.ToException();

        return ResponseCatalog.Organization.Retrieved
            .As<OrganizationResponse>()
            .WithData(organization.ToOrganizationResponse())
            .ToOperationResult();
    }
}
