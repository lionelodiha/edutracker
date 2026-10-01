using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Features.Classes.Models;
using EduTracker.Application.Models;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Classes.GetClassesByOffering;

internal sealed class GetClassesByOfferingQueryHandler(
    AppDbContext db
) : IHandler<GetClassesByOfferingQuery, OperationResult<IReadOnlyList<ClassResponse>>>
{
    public async Task<OperationResult<IReadOnlyList<ClassResponse>>> Handle(GetClassesByOfferingQuery message, CancellationToken cancellationToken = default)
    {
        bool hasAccess = await db.CourseOfferings
            .AsNoTracking()
            .AnyAsync(
                item => item.Id == message.CourseOfferingId && item.Term.Semester.OrganizationId == message.OrganizationId,
                cancellationToken
            );

        if (!hasAccess)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        List<ClassResponse> classes = await db.Classes
            .AsNoTracking()
            .Where(item => item.CourseOfferingId == message.CourseOfferingId)
            .OrderBy(item => item.Code)
            .Select(item => new ClassResponse(
                item.Id,
                item.CourseOfferingId,
                item.Code,
                item.InstructorId,
                item.Instructor != null ? item.Instructor.UserName : null,
                item.MaxCapacity,
                item.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return ResponseCatalog.System.Ok
            .As<IReadOnlyList<ClassResponse>>()
            .WithData(classes)
            .ToOperationResult();
    }
}
