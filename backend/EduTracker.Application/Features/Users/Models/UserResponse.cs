using EduTracker.Domain.Entities.Users;

namespace EduTracker.Application.Features.Users.Models;

public sealed record UserResponse(
    Guid Id,
    string UserName,
    string FirstName,
    string? MiddleName,
    string LastName,
    UserRole Role
);
