using EduTracker.Application.CQRS.Messaging;
using EduTracker.Application.Models;

namespace EduTracker.Application.Features.Seeders.SeedSuperAdmin;

public sealed record SeedSuperAdminCommand(
    string FirstName,
    string? MiddleName,
    string LastName,
    string UserName,
    string Email,
    string Password
) : IMessage<OperationResult<object>>;
