using EduTracker.Application.Constants.Cache;
using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Application.Services;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Academics.Courses.CreateCourse;

internal sealed class CreateCourseCommandHandler(
    AppDbContext db,
    ICacheService cacheService
) : IHandler<CreateCourseCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateCourseCommand message, CancellationToken cancellationToken = default)
    {
        await AcademicAccessGuard.EnsureCanManage(db, message.OrganizationId, message.ActorId, cancellationToken);

        bool exists = await db.Courses
            .AsNoTracking()
            .AnyAsync(
                course => course.OrganizationId == message.OrganizationId
                    && course.Code == message.Code.Trim().ToUpperInvariant(),
                cancellationToken
            );

        if (exists)
            throw ResponseCatalog.Course.AlreadyExists.ToException();

        Course course = new(message.Name, message.Code, message.OrganizationId);

        db.Courses.Add(course);
        await db.SaveChangesAsync(cancellationToken);

        await cacheService.RemoveAsync(CacheKeys.Courses(message.OrganizationId));

        return ResponseCatalog.Course.Created
            .As<Guid>()
            .WithData(course.Id)
            .ToOperationResult();
    }
}
