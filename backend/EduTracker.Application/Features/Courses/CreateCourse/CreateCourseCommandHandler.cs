using EduTracker.Application.Constants.Responses;
using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Extensions.Responses;
using EduTracker.Application.Models;
using EduTracker.Domain.Entities.Academics;
using EduTracker.Domain.Enums;
using EduTracker.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Application.Features.Courses.CreateCourse;

public sealed class CreateCourseCommandHandler(
    AppDbContext db
) : IHandler<CreateCourseCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateCourseCommand message, CancellationToken cancellationToken = default)
    {
        if (message.ActorId is null)
            throw ResponseCatalog.Auth.InvalidSession.ToException();

        OrganizationMember? actor = await db.OrganizationMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.OrganizationId == message.OrganizationId && m.UserId == message.ActorId.Value, cancellationToken);

        if (actor is null || actor.Status != OrganizationMemberStatus.Active || actor.Role != OrganizationMemberRole.Admin)
            throw ResponseCatalog.Authorization.Forbidden.ToException();

        Course course = new(
            organizationId: message.OrganizationId,
            name: message.Name,
            description: message.Description
        );

        db.Courses.Add(course);
        await db.SaveChangesAsync(cancellationToken);

        return ResponseCatalog.Course.Created
            .As<Guid>()
            .WithData(course.Id)
            .ToOperationResult();
    }
}
