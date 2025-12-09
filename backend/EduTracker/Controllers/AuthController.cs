using EduTracker.Data;
using EduTracker.DTOs;
using EduTracker.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EduTracker.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
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

        if (await _context.Users.AnyAsync(u => u.Email == invitation.Email))
        {
             return BadRequest(new { message = "User with this email already exists." });
        }

        if (!string.IsNullOrEmpty(dto.Username) && await _context.Users.AnyAsync(u => u.Username == dto.Username))
        {
            return BadRequest(new { message = "Username is already taken." });
        }

        var newUser = new User
        {
            Email = invitation.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            MiddleName = dto.MiddleName,
            Username = dto.Username,
            Password = dto.Password,
            Role = invitation.Role,
            Status = "active", // Auto-activate invited users
            AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.FirstName + "+" + dto.LastName)}",
            OrganizationId = invitation.OrganizationId
        };

        _context.Users.Add(newUser);
            invitation.Status = "used";
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                message = "Signup successful.", 
                user = newUser,
                token = "mock-jwt-token-" + Guid.NewGuid().ToString()
            });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.EmailOrUsername || u.Username == loginDto.EmailOrUsername);

        if (user == null || user.Password != loginDto.Password)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Master Admin check
        if (user.Role == "master_admin")
        {
             return Ok(new
            {
                user,
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
            user,
            token = "mock-jwt-token-" + Guid.NewGuid().ToString(),
            organizationName
        });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupDto signupDto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == signupDto.Email))
        {
            return BadRequest(new { message = "User with this email already exists" });
        }

        if (!string.IsNullOrEmpty(signupDto.Username) && await _context.Users.AnyAsync(u => u.Username == signupDto.Username))
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

        var newUser = new User
        {
            Email = signupDto.Email,
            FirstName = signupDto.FirstName,
            LastName = signupDto.LastName,
            MiddleName = signupDto.MiddleName,
            Username = signupDto.Username,
            Password = signupDto.Password,
            Role = signupDto.Role,
            Status = signupDto.Role == "admin" && string.IsNullOrEmpty(signupDto.OrganizationId) ? "active" : "pending",
            AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(signupDto.FirstName + "+" + signupDto.LastName)}",
            OrganizationId = organizationId
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Signup successful.", user = newUser });
    }
}
