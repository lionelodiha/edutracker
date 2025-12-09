using EduTracker.Data;
using EduTracker.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduTracker.Interfaces.Services;
using EduTracker.Endpoints.Users;
using EduTracker.Endpoints.Users.RegisterUser;
using EntityUser = EduTracker.Entities.User;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHashingService _hashingService;
    private readonly IDataEncryptionService _dataEncryptionService;

    public AuthController(AppDbContext context, IHashingService hashingService, IDataEncryptionService dataEncryptionService)
    {
        _context = context;
        _hashingService = hashingService;
        _dataEncryptionService = dataEncryptionService;
    }

    [HttpPost("signup-invite")]
    public async Task<IActionResult> SignupInvite([FromBody] InvitationSignupDto dto)
    {
        var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.Id == dto.Token);

        if (invitation == null || invitation.Status != "pending")
        {
            return BadRequest(new { message = "Invalid or expired invitation." });
        }

        if (invitation.ExpiresAt.HasValue && invitation.ExpiresAt.Value < DateTime.UtcNow)
        {
            invitation.Status = "expired";
            await _context.SaveChangesAsync();
            return BadRequest(new { message = "Invitation has expired." });
        }

        string normalizedEmail = invitation.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash))
        {
             return BadRequest(new { message = "User with this email already exists." });
        }

        if (!string.IsNullOrEmpty(dto.Username) && await _context.Users.AnyAsync(u => u.UserName == dto.Username))
        {
            return BadRequest(new { message = "Username is already taken." });
        }

        // Create Request
        var registerRequest = new RegisterUserRequest(
            dto.FirstName,
            dto.MiddleName ?? "",
            dto.LastName,
            dto.Username ?? (dto.FirstName.ToLower() + "." + dto.LastName.ToLower()),
            invitation.Email,
            dto.Password
        );

        string passwordHash = _hashingService.HashPassword(dto.Password);

        EntityUser newUser = UserFactory.Create(
            registerRequest,
            normalizedEmail,
            emailHash,
            passwordHash,
            _dataEncryptionService
        );

        newUser.SetRole(invitation.Role);
        newUser.SetStatus("active"); // Auto-activate invited users
        newUser.SetAvatarUrl($"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.FirstName + "+" + dto.LastName)}");
        newUser.SetOrganizationId(invitation.OrganizationId);

        _context.Users.Add(newUser);
        invitation.Status = "used";
        await _context.SaveChangesAsync();

        // Constructing response DTO manually to avoid sending hashes
        var responseUser = new
        {
            Id = newUser.Id,
            Email = invitation.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Username = dto.Username,
            Role = newUser.Role,
            Status = newUser.Status,
            AvatarUrl = newUser.AvatarUrl,
            OrganizationId = newUser.OrganizationId
        };

        return Ok(new
        {
            message = "Signup successful.",
            user = responseUser,
            token = "mock-jwt-token-" + Guid.NewGuid().ToString()
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        // Login can be by email or username.
        EntityUser? user = null;
        bool isEmail = loginDto.EmailOrUsername.Contains("@");

        if (isEmail)
        {
            string normalizedEmail = loginDto.EmailOrUsername.Trim().ToLowerInvariant();
            string emailHash = _hashingService.HashEmail(normalizedEmail);
            user = await _context.Users.FirstOrDefaultAsync(u => u.EmailHash == emailHash);
        }
        else
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == loginDto.EmailOrUsername);
        }

        if (user == null || !_hashingService.VerifyPassword(loginDto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Master Admin check
        if (user.Role == "master_admin")
        {
             return Ok(new
            {
                user, // TODO: Return DTO
                token = "mock-jwt-token-" + Guid.NewGuid().ToString(),
                organizationName = "EduTracker Global"
            });
        }

        if (user.Status == "pending")
        {
            return Unauthorized(new { message = "Your account is pending approval by an administrator." });
        }

        if (user.Status == "rejected")
        {
            return Unauthorized(new { message = "Your account has been suspended or rejected." });
        }

        // Fetch Organization Name
        string? organizationName = null;
        if (!string.IsNullOrEmpty(user.OrganizationId))
        {
            var org = await _context.Organizations.FindAsync(user.OrganizationId);
            organizationName = org?.Name;
        }

        return Ok(new
        {
            user, // TODO: Return DTO
            token = "mock-jwt-token-" + Guid.NewGuid().ToString(),
            organizationName
        });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupDto signupDto)
    {
        string normalizedEmail = signupDto.Email.Trim().ToLowerInvariant();
        string emailHash = _hashingService.HashEmail(normalizedEmail);

        if (await _context.Users.AnyAsync(u => u.EmailHash == emailHash))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        if (!string.IsNullOrEmpty(signupDto.Username) && await _context.Users.AnyAsync(u => u.UserName == signupDto.Username))
        {
            return BadRequest(new { message = "Username is already taken" });
        }

        string organizationId = signupDto.OrganizationId;

        if (string.IsNullOrEmpty(organizationId))
        {
            if (signupDto.Role == "admin")
            {
                return BadRequest(new { message = "To register a new school/organization, please visit the Pricing page and subscribe." });
            }
            else
            {
                return BadRequest(new { message = "Organization ID is required for this role." });
            }
        }
        else
        {
            // Verify Organization exists
            var orgExists = await _context.Organizations.AnyAsync(o => o.Id == organizationId);
            if (!orgExists)
            {
                return BadRequest(new { message = "Invalid Organization ID." });
            }
        }

        var registerRequest = new RegisterUserRequest(
            signupDto.FirstName,
            signupDto.MiddleName ?? "",
            signupDto.LastName,
            signupDto.Username ?? (signupDto.FirstName.ToLower() + "." + signupDto.LastName.ToLower()),
            signupDto.Email,
            signupDto.Password
        );

        string passwordHash = _hashingService.HashPassword(signupDto.Password);

        EntityUser newUser = UserFactory.Create(
            registerRequest,
            normalizedEmail,
            emailHash,
            passwordHash,
            _dataEncryptionService
        );

        newUser.SetRole(signupDto.Role);
        newUser.SetStatus(signupDto.Role == "admin" && string.IsNullOrEmpty(signupDto.OrganizationId) ? "active" : "pending");
        newUser.SetAvatarUrl($"https://ui-avatars.com/api/?name={Uri.EscapeDataString(signupDto.FirstName + "+" + signupDto.LastName)}");
        newUser.SetOrganizationId(organizationId);

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Signup successful.", user = newUser });
    }
}
