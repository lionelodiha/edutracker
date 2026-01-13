using EduTracker.Domain.Enums;

namespace EduTracker.Application.Features.Users.Models;

public record UserResponse(
    Guid Id,
    string UserName,
    string FirstName,
    string MiddleName,
    string LastName,
    SystemRole Role
);
